const db = require('../config/db');

class EmployeeService {
    async getAllEmployees() {
        try {
            const query = `
                SELECT 
                    dEmployeeEntry_ID,
                    dEmployee_ID,
                    dEmployee_Name,
                    dHire_Date,
                    dClassification,
                    dClientSite_ID,
                    dClientName,
                    dLOB,
                    dSubLOB,
                    dSupervisor_ID,
                    dSupervisor_Name,
                    dManager_ID,
                    dManager_Name,
                    dDataSet
                FROM tbl_employee
                ORDER BY dEmployeeEntry_ID DESC
            `;
            const [rows] = await db.query(query);
            return rows;
        } catch (error) {
            throw new Error(`Error fetching employees: ${error.message}`);
        }
    }

    async getEmployeeById(employeeId) {
        try {
            const query = `
                SELECT 
                    dEmployeeEntry_ID,
                    dEmployee_ID,
                    dEmployee_Name,
                    dHire_Date,
                    dClassification,
                    dClientSite_ID,
                    dClientName,
                    dLOB,
                    dSubLOB,
                    dSupervisor_ID,
                    dSupervisor_Name,
                    dManager_ID,
                    dManager_Name,
                    dDataSet
                FROM tbl_employee
                WHERE dEmployee_ID = ?
            `;
            const [rows] = await db.query(query, [employeeId]);
            return rows[0];
        } catch (error) {
            throw new Error(`Error fetching employee: ${error.message}`);
        }
    }

    async createEmployee(employeeData) {
        try {
            const query = `
                INSERT INTO tbl_employee (
                    dEmployee_ID,
                    dEmployee_Name,
                    dHire_Date,
                    dClassification,
                    dClientSite_ID,
                    dClientName,
                    dLOB,
                    dSubLOB,
                    dSupervisor_ID,
                    dSupervisor_Name,
                    dManager_ID,
                    dManager_Name,
                    dDataSet
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const values = [
                employeeData.dEmployee_ID,
                employeeData.dEmployee_Name,
                employeeData.dHire_Date,
                employeeData.dClassification,
                employeeData.dClient_Site_ID,
                employeeData.dClientName,
                employeeData.dLOB,
                employeeData.dSubLOB,
                employeeData.dSupervisor_ID,
                employeeData.dSupervisor_Name,
                employeeData.dManager_ID,
                employeeData.dManager_Name,
                employeeData.dDataSet
            ];
            const [result] = await db.query(query, values);
            return { ...employeeData, dEmployeeEntry_ID: result.insertId };
        } catch (error) {
            throw new Error(`Error creating employee: ${error.message}`);
        }
    }

    async updateEmployee(employeeId, employeeData) {
        try {
            const query = `
                UPDATE tbl_employee
                SET 
                    dEmployee_Name = ?,
                    dHire_Date = ?,
                    dClassification = ?,
                    dClientSite_ID = ?,
                    dClientName = ?,
                    dLOB = ?,
                    dSubLOB = ?,
                    dSupervisor_ID = ?,
                    dSupervisor_Name = ?,
                    dManager_ID = ?,
                    dManager_Name = ?,
                    dDataSet = ?
                WHERE dEmployee_ID = ?
            `;
            const values = [
                employeeData.dEmployee_Name,
                employeeData.dHire_Date,
                employeeData.dClassification,
                employeeData.dClient_Site_ID,
                employeeData.dClientName,
                employeeData.dLOB,
                employeeData.dSubLOB,
                employeeData.dSupervisor_ID,
                employeeData.dSupervisor_Name,
                employeeData.dManager_ID,
                employeeData.dManager_Name,
                employeeData.dDataSet,
                employeeId
            ];
            const [result] = await db.query(query, values);
            if (result.affectedRows === 0) {
                return null;
            }
            return { ...employeeData, dEmployee_ID: employeeId };
        } catch (error) {
            throw new Error(`Error updating employee: ${error.message}`);
        }
    }

    async deleteEmployee(employeeId) {
        try {
            const query = `
                DELETE FROM tbl_employee
                WHERE dEmployee_ID = ?
            `;
            const [result] = await db.query(query, [employeeId]);
            if (result.affectedRows === 0) {
                return null;
            }
            return { dEmployee_ID: employeeId };
        } catch (error) {
            throw new Error(`Error deleting employee: ${error.message}`);
        }
    }

    async getActiveSites() {
        try {
            const query = `
                SELECT 
                    dSite_ID,
                    dSiteName
                FROM tbl_site
                WHERE dStatus = 'ACTIVE'
                ORDER BY dSiteName ASC
            `;
            const [rows] = await db.query(query);
            return rows;
        } catch (error) {
            throw new Error(`Error fetching active sites: ${error.message}`);
        }
    }
}

module.exports = new EmployeeService(); 