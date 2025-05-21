const securityQuestionsService = require('../services/securityQuestionsService');

class SecurityQuestionsController {
  async getQuestions(req, res) {
    try {
      const { email } = req.query;
      
      if (!email) {
        return res.status(400).json({ 
          success: false,
          message: 'Email is required' 
        });
      }

      const questions = await securityQuestionsService.getSecurityQuestions(email);
      res.status(200).json({ 
        success: true,
        questions 
      });
    } catch (error) {
      console.error('Error getting security questions:', error);
      res.status(500).json({ 
        success: false,
        message: error.message 
      });
    }
  }

  async verifyAnswers(req, res) {
    try {
      const { email, answers } = req.body;
      
      if (!email || !answers || Object.keys(answers).length === 0) {
        return res.status(400).json({ 
          success: false,
          message: 'Email and answers are required' 
        });
      }

      const isVerified = await securityQuestionsService.verifyAnswers(email, answers);
      
      if (isVerified) {
        res.status(200).json({ 
          success: true,
          message: 'Answers verified successfully' 
        });
      } else {
        res.status(200).json({ 
          success: false,
          message: 'One or more answers are incorrect' 
        });
      }
    } catch (error) {
      console.error('Error verifying answers:', error);
      res.status(500).json({ 
        success: false,
        message: error.message 
      });
    }
  }
}

module.exports = new SecurityQuestionsController();