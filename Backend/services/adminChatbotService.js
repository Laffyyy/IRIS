const pool = require('../config/db');
const axios = require('axios');
const { getSystemPrompt, getResponse, getErrorResponse } = require('../training/adminChatbotTraining');

const processAdminQuery = async (userId, userQuery) => {
    try {
        console.log('Processing admin query...');
        
        // First, check if we have a predefined response
        const predefinedResponse = getResponse(userQuery);
        if (predefinedResponse) {
            console.log('Using predefined response');
            
            // Log the interaction in the database
            await pool.execute(
                'INSERT INTO tbl_logs_ai (dQueryBy_ID, dUser_Role, dUser_Query, dAI_Response) VALUES (?, ?, ?, ?)',
                [userId, 'ADMIN', userQuery, predefinedResponse]
            );

            return {
                success: true,
                response: predefinedResponse,
                source: 'predefined'
            };
        }

        // If no predefined response, use DeepSeek API
        console.log('Sending request to DeepSeek API...');
        const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
            model: 'deepseek-chat',
            messages: [
                { role: 'system', content: getSystemPrompt() },
                { role: 'user', content: userQuery }
            ],
            temperature: 0.7
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Received response from DeepSeek API');
        const aiResponse = response.data.choices[0].message.content;

        // Log the interaction in the database
        console.log('Logging interaction to database...');
        await pool.execute(
            'INSERT INTO tbl_logs_ai (dQueryBy_ID, dUser_Role, dUser_Query, dAI_Response) VALUES (?, ?, ?, ?)',
            [userId, 'ADMIN', userQuery, aiResponse]
        );

        console.log('Database operation completed');
        return {
            success: true,
            response: aiResponse,
            source: 'ai'
        };
    } catch (error) {
        console.error('Detailed error in processAdminQuery:', {
            message: error.message,
            stack: error.stack,
            response: error.response?.data,
            status: error.response?.status
        });
        
        // Get appropriate error response
        const errorResponse = getErrorResponse('systemError');
        
        // Log the error in the database
        try {
            await pool.execute(
                'INSERT INTO tbl_logs_ai (dQueryBy_ID, dUser_Role, dUser_Query, dAI_Response) VALUES (?, ?, ?, ?)',
                [userId, 'ADMIN', userQuery, errorResponse]
            );
        } catch (dbError) {
            console.error('Error logging to database:', dbError);
        }
        
        throw new Error(errorResponse);
    }
};

const getAdminChatHistory = async (userId) => {
    try {
        console.log('Fetching admin chat history...');
        
        const [rows] = await pool.execute(
            'SELECT dLog_ID, dUser_Query, dAI_Response, tTimeStamp FROM tbl_logs_ai WHERE dQueryBy_ID = ? AND dUser_Role = ? ORDER BY tTimeStamp DESC',
            [userId, 'ADMIN']
        );

        console.log('Chat history fetched successfully');
        return {
            success: true,
            history: rows
        };
    } catch (error) {
        console.error('Detailed error in getAdminChatHistory:', {
            message: error.message,
            stack: error.stack,
            code: error.code
        });
        throw error;
    }
};

module.exports = {
    processAdminQuery,
    getAdminChatHistory
}; 