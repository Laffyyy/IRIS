const employeeService = require('../services/employeeService');

class EmployeeController {
    async getAllEmployees(req, res) {
        try {
            const employees = await employeeService.getAllEmployees();
            res.json({
                success: true,
                data: employees
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async getEmployeeById(req, res) {
        try {
            const { id } = req.params;
            const employee = await employeeService.getEmployeeById(id);
            
            if (!employee) {
                return res.status(404).json({
                    success: false,
                    message: 'Employee not found'
                });
            }

            res.json({
                success: true,
                data: employee
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async createEmployee(req, res) {
        try {
            const employeeData = req.body;
            const newEmployee = await employeeService.createEmployee(employeeData);
            
            res.status(201).json({
                success: true,
                data: newEmployee
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async updateEmployee(req, res) {
        try {
            const { id } = req.params;
            const employeeData = req.body;
            
            const updatedEmployee = await employeeService.updateEmployee(id, employeeData);
            
            if (!updatedEmployee) {
                return res.status(404).json({
                    success: false,
                    message: 'Employee not found'
                });
            }

            res.json({
                success: true,
                data: updatedEmployee
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async deleteEmployee(req, res) {
        try {
            const { id } = req.params;
            const deletedEmployee = await employeeService.deleteEmployee(id);
            
            if (!deletedEmployee) {
                return res.status(404).json({
                    success: false,
                    message: 'Employee not found'
                });
            }

            res.json({
                success: true,
                data: deletedEmployee
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = new EmployeeController(); 