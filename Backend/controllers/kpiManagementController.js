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
    try {
        const { dKPI_Name, dCategory, dDescription, dCalculationBehavior } = req.body;
        
        const [result] = await db.execute(
            'UPDATE tbl_kpi SET dKPI_Name = ?, dCategory = ?, dDescription = ?, dCalculationBehavior = ? WHERE dKPI_ID = ?',
            [dKPI_Name, dCategory, dDescription, dCalculationBehavior, req.params.id]
        );

        if (result.affectedRows > 0) {
            res.json({ message: "KPI updated successfully" });
        } else {
            res.status(404).json({ message: "KPI not found" });
        }
    } catch (error) {
        res.status(500).json({ message: "Error updating KPI", error: error.message });
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