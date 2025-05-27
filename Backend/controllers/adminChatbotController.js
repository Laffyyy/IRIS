const adminChatbotService = require('../services/adminChatbotService');

const processQuery = async (req, res) => {
    try {
        console.log('Received query request:', req.body);
        const { userId, userQuery } = req.body;
        
        if (!userId || !userQuery) {
            console.error('Missing required fields:', { userId, userQuery });
            return res.status(400).json({ 
                error: 'User ID and query are required',
                received: { userId, userQuery }
            });
        }

        console.log('Processing query for user:', userId);
        const response = await adminChatbotService.processAdminQuery(userId, userQuery);
        console.log('Query processed successfully');
        res.json(response);
    } catch (error) {
        console.error('Error in processQuery controller:', {
            message: error.message,
            stack: error.stack,
            code: error.code
        });
        
        // Send more detailed error response
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message,
            code: error.code
        });
    }
};

const getChatHistory = async (req, res) => {
    try {
        console.log('Received history request:', req.query);
        const { userId } = req.query;
        
        if (!userId) {
            console.error('Missing userId in query parameters');
            return res.status(400).json({ 
                error: 'User ID is required',
                received: { userId }
            });
        }

        console.log('Fetching chat history for user:', userId);
        const history = await adminChatbotService.getAdminChatHistory(userId);
        console.log('Chat history fetched successfully');
        res.json(history);
    } catch (error) {
        console.error('Error in getChatHistory controller:', {
            message: error.message,
            stack: error.stack,
            code: error.code
        });
        
        // Send more detailed error response
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message,
            code: error.code
        });
    }
};

module.exports = {
    processQuery,
    getChatHistory
}; 