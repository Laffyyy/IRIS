const app = require('./app');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

// Add error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', {
        message: error.message,
        stack: error.stack,
        code: error.code
    });
    process.exit(1);
});

// Add error handling for unhandled promise rejections
process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', {
        message: error.message,
        stack: error.stack,
        code: error.code
    });
    process.exit(1);
});

// Verify environment variables
console.log('Checking environment variables...');
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'DEEPSEEK_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
    console.error('Missing required environment variables:', missingEnvVars);
    process.exit(1);
}

const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log('Environment:', process.env.NODE_ENV || 'development');
    console.log('Available routes:');
    console.log('- POST /api/login');
    console.log('- POST /api/login/register');
    console.log('- POST /api/otp');
    console.log('- POST /api/admin/chatbot/query');
    console.log('- GET /api/admin/chatbot/history');
});

// Add error handling for the server
server.on('error', (error) => {
    console.error('Server error:', {
        message: error.message,
        stack: error.stack,
        code: error.code
    });
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
        process.exit(1);
    }
}); 