const db = require('../config/db');
const logService = require('../services/logService');

exports.getAllKPIs = async (req, res) => {
    try {
        const [kpis] = await db.execute('SELECT * FROM tbl_kpi');
        res.json(kpis);
    } catch (error) {
        res.status(500).json({ message: "Error fetching KPIs", error: error.message });
    }
};

exports.getKPIById = async (req, res) => {
    try {
        const [kpi] = await db.execute('SELECT * FROM tbl_kpi WHERE dKPI_ID = ?', [req.params.id]);
        if (kpi.length > 0) {
            res.json(kpi[0]);
        } else {
            res.status(404).json({ message: "KPI not found" });
        }
    } catch (error) {
        res.status(500).json({ message: "Error fetching KPI", error: error.message });
    }
};

exports.createKPI = async (req, res) => {
    try {
        const { dKPI_Name, dCategory, dDescription, dCalculationBehavior, dCreatedBy } = req.body;
        
        // Add validation
        if (!dKPI_Name || !dCategory || !dCalculationBehavior || !dCreatedBy) {
            return res.status(400).json({ 
                message: "Missing required fields",
                details: {
                    name: !dKPI_Name,
                    category: !dCategory,
                    behavior: !dCalculationBehavior,
                    createdBy: !dCreatedBy
                }
            });
        }

        // Log the incoming data
        console.log('Creating KPI with data:', {
            dKPI_Name,
            dCategory,
            dDescription,
            dCalculationBehavior,
            dCreatedBy
        });
        
        const [result] = await db.execute(
            'INSERT INTO tbl_kpi (dKPI_Name, dCategory, dDescription, dCalculationBehavior, dCreatedBy, tCreatedAt) VALUES (?, ?, ?, ?, ?, NOW())',
            [dKPI_Name, dCategory, dDescription || '', dCalculationBehavior, dCreatedBy]
        );


        res.status(201).json({
            message: "KPI created successfully",
            kpiId: result.insertId
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ 
            message: "Error creating KPI", 
            error: error.message,
            details: error.stack
        });
    }
};

exports.updateKPI = async (req, res) => {
    const { id } = req.params;
    const { dKPI_Name, dCategory, dCalculationBehavior, dDescription, dStatus } = req.body;

    try {
        // Log the incoming request data
        console.log('Update KPI Request:', {
            id,
            body: req.body,
            params: req.params
        });

        // Validate required fields
        if (!dKPI_Name || !dCategory || !dCalculationBehavior) {
            return res.status(400).json({
                message: "Missing required fields",
                details: {
                    name: !dKPI_Name,
                    category: !dCategory,
                    behavior: !dCalculationBehavior
                }
            });
        }

        // Ensure dStatus is in correct case for ENUM and never null
        const status = dStatus ? dStatus.toUpperCase() : 'ACTIVE';
        console.log('Processed status:', status);

        // First, check if the KPI exists
        const [existingKPI] = await db.execute('SELECT * FROM tbl_kpi WHERE dKPI_ID = ?', [id]);
        console.log('Existing KPI:', existingKPI[0]);

        if (existingKPI.length === 0) {
            return res.status(404).json({ message: "KPI not found" });
        }

        // Log the SQL query and parameters
        const updateQuery = 'UPDATE tbl_kpi SET dKPI_Name = ?, dCategory = ?, dCalculationBehavior = ?, dDescription = ?, dStatus = ? WHERE dKPI_ID = ?';
        const queryParams = [dKPI_Name, dCategory, dCalculationBehavior, dDescription || '', status, id];
        console.log('Update Query:', updateQuery);
        console.log('Query Parameters:', queryParams);

        // Update the KPI
        const [updated] = await db.execute(updateQuery, queryParams);
        console.log('Update result:', updated);

        if (updated.affectedRows > 0) {
            // Fetch the updated KPI
            const [updatedKPI] = await db.execute('SELECT * FROM tbl_kpi WHERE dKPI_ID = ?', [id]);
            console.log('Updated KPI:', updatedKPI[0]);
            res.json(updatedKPI[0]);
        } else {
            res.status(404).json({ message: "KPI not found" });
        }
    } catch (error) {
        // Log the full error object
        console.error('Detailed error in updateKPI:', {
            message: error.message,
            stack: error.stack,
            sqlMessage: error.sqlMessage,
            sqlState: error.sqlState,
            sqlCode: error.sqlCode,
            error: error
        });

        // Check for specific MySQL errors
        if (error.sqlMessage) {
            if (error.sqlMessage.includes('ENUM')) {
                return res.status(400).json({
                    message: "Invalid status value",
                    details: "Status must be either 'ACTIVE' or 'DEACTIVATED'"
                });
            }
            if (error.sqlMessage.includes('foreign key')) {
                return res.status(400).json({
                    message: "Database constraint error",
                    details: error.sqlMessage
                });
            }
        }

        res.status(500).json({ 
            message: "Error updating KPI", 
            error: error.message,
            details: error.sqlMessage || error.stack
        });
    }
};

exports.deleteKPI = async (req, res) => {
    try {
        const [result] = await db.execute('DELETE FROM tbl_kpi WHERE dKPI_ID = ?', [req.params.id]);
        

        if (result.affectedRows > 0) {
            res.json({ message: "KPI deleted successfully" });
        } else {
            res.status(404).json({ message: "KPI not found" });
        }
    } catch (error) {
        res.status(500).json({ message: "Error deleting KPI", error: error.message });
    }
};

exports.deactivateKPI = async (req, res) => {
    try {
        console.log('Deactivating KPI with ID:', req.params.id);
        
        // First check if KPI exists
        const [kpi] = await db.execute('SELECT * FROM tbl_kpi WHERE dKPI_ID = ?', [req.params.id]);
        
        if (kpi.length === 0) {
            console.log('KPI not found with ID:', req.params.id);
            return res.status(404).json({ message: "KPI not found" });
        }

        // Proceed with deactivation
        const [result] = await db.execute(
            'UPDATE tbl_kpi SET dStatus = "DEACTIVATED" WHERE dKPI_ID = ?',
            [req.params.id]
        );

        console.log('Update result:', result);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Failed to deactivate KPI" });
        }

        res.json({ 
            message: "KPI deactivated successfully",
            kpiId: req.params.id
        });
    } catch (error) {
        console.error('Error in deactivateKPI:', error);
        res.status(500).json({ 
            message: "Error deactivating KPI", 
            error: error.message,
            details: error.stack
        });
    }
};

exports.reactivateKPI = async (req, res) => {
    try {
        const [result] = await db.execute(
            'UPDATE tbl_kpi SET dStatus = "ACTIVE" WHERE dKPI_ID = ?',
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "KPI not found" });
        }

        res.json({ message: "KPI reactivated successfully" });
    } catch (error) {
        res.status(500).json({ 
            message: "Error reactivating KPI", 
            error: error.message 
        });
    }
};