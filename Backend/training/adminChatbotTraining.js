const adminTrainingData = {
    // System prompt that defines the chatbot's role and behavior
    systemPrompt: `You are an assistant for an admin of IRIS (Incentives Reporting and Insights Solutions) with specifically defined access privileges. 
    Your role is strictly limited to user account monitoring and system configuration viewing.`,

    // Common administrative queries and their responses
    commonQueries: {
        "admin chatbot profile": {
            query: "Who are you?",
            response: "I am a chatbot designed to assist you with administrative tasks and system configuration. My name is IRIS Admin Assistant."
        },
        "admin privileges": {
            query: "What are my admin privileges?",
            response: "As an administrator, you have the following privileges:\n" +
                     "1. User Management: Create, modify, and deactivate user accounts\n" +
                     "2. System Configuration: Modify system settings and parameters\n" +
                     "3. Access Control: Manage permissions and access levels\n" +
                     "4. Reports: Generate and access system reports\n" +
                     "5. Security: Manage security settings and monitor system access"
        },
        "user management": {
            query: "How do I manage users?",
            response: "To manage users, you can:\n" +
                     "1. Create new users through the user management interface\n" +
                     "2. Modify existing user details and permissions\n" +
                     "3. Deactivate user accounts when needed\n" +
                     "4. Reset user passwords\n" +
                     "5. View user activity logs"
        },
        "system settings": {
            query: "How do I change system settings?",
            response: "System settings can be modified through:\n" +
                     "1. Access the System Configuration panel\n" +
                     "2. Navigate to the specific setting you want to change\n" +
                     "3. Make the necessary modifications\n" +
                     "4. Save changes and verify the updates\n" +
                     "Note: Some changes may require system restart"
        }
    },

    // Context-specific responses
    contextResponses: {
        security: {
            keywords: ["password", "security", "access", "permission"],
            response: "For security-related queries, please ensure you:\n" +
                     "1. Follow the organization's security protocols\n" +
                     "2. Use strong password policies\n" +
                     "3. Implement proper access controls\n" +
                     "4. Report any security concerns immediately"
        },
        reports: {
            keywords: ["report", "analytics", "data", "statistics"],
            response: "For generating reports:\n" +
                     "1. Access the Reports section\n" +
                     "2. Select the report type\n" +
                     "3. Choose the date range\n" +
                     "4. Configure any specific parameters\n" +
                     "5. Generate and export the report"
        }
    },

    // Error handling responses
    errorResponses: {
        invalidRequest: "I apologize, but I couldn't understand your request. Could you please rephrase it?",
        unauthorized: "I'm sorry, but I cannot provide that information as it requires higher authorization levels.",
        notFound: "I couldn't find the information you're looking for. Please try rephrasing your question.",
        systemError: "I'm experiencing some technical difficulties. Please try again in a few moments."
    }
};

// Function to get appropriate response based on query
const getResponse = (query) => {
    // Convert query to lowercase for case-insensitive matching
    const lowerQuery = query.toLowerCase().trim();

    // Check for identity-related queries first
    if (lowerQuery === "who are you?" || 
        lowerQuery === "who are you" || 
        lowerQuery === "what are you?" || 
        lowerQuery === "what are you" ||
        lowerQuery.includes("your name") ||
        lowerQuery.includes("who is iris")) {
        return adminTrainingData.commonQueries["admin chatbot profile"].response;
    }

    // Check common queries
    for (const [key, data] of Object.entries(adminTrainingData.commonQueries)) {
        // Check if the query matches the exact question or contains key phrases
        if (lowerQuery === data.query.toLowerCase() || 
            lowerQuery.includes(key) || 
            lowerQuery.includes(data.query.toLowerCase())) {
            return data.response;
        }
    }

    // Check context-specific responses
    for (const [context, data] of Object.entries(adminTrainingData.contextResponses)) {
        if (data.keywords.some(keyword => lowerQuery.includes(keyword))) {
            return data.response;
        }
    }

    // If no specific match is found, return a default response
    return "I understand you're asking about administrative matters. Could you please provide more specific details about what you need help with?";
};

// Function to get the system prompt
const getSystemPrompt = () => {
    return adminTrainingData.systemPrompt;
};

// Function to get error response
const getErrorResponse = (errorType) => {
    return adminTrainingData.errorResponses[errorType] || adminTrainingData.errorResponses.systemError;
};

module.exports = {
    getResponse,
    getSystemPrompt,
    getErrorResponse,
    adminTrainingData
}; 