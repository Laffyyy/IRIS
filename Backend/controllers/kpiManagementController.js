const kpiService = require('../services/kpiService');
const logService = require('../services/logService');

exports.getAllKPIs = async (req, res) => {
    try {
        const kpis = await kpiService.getAllKPIs();
        res.json(kpis);
    } catch (error) {
        res.status(500).json({ message: "Error fetching KPIs", error: error.message });
    }
};

exports.getKPIById = async (req, res) => {
    try {
        const kpi = await kpiService.getKPIById(req.params.id);
        res.json(kpi);
    } catch (error) {
        if (error.message === 'KPI not found') {
            res.status(404).json({ message: error.message });
        } else {
            res.status(500).json({ message: "Error fetching KPI", error: error.message });
        }
    }
};

exports.createKPI = async (req, res) => {
    try {
        // First create the KPI
        console.log('Creating KPI with body:', req.body);
        const result = await kpiService.createKPI(req.body);
        console.log('KPI created with result:', result);

        // Then attempt to log the action
        try {
            const logData = {
                dActionLocation_ID: result.dKPI_ID,
                dActionLocation: 'KPI',
                dActionType: 'CREATED',
                dActionBy: req.body.dCreatedBy || 'system',
                tActionAt: result.tCreatedAt
            };
            console.log('Attempting to log action with data:', logData);
            
            await logService.logAdminAction(logData);
            console.log('Action logged successfully');
        } catch (logError) {
            console.error('Failed to log action:', logError);
            // Continue execution even if logging fails
        }

        res.status(201).json(result);
    } catch (error) {
        console.error('Error in createKPI:', error);
        res.status(500).json({ 
            message: "Error creating KPI", 
            error: error.message 
        });
    }
};

exports.updateKPI = async (req, res) => {
    try {
        const result = await kpiService.updateKPI(req.params.id, req.body);
        
        // Log the update action
        await logService.logAdminAction({
            dActionLocation_ID: req.params.id,
            dActionLocation: 'KPI',
            dActionType: 'MODIFIED',
            dActionBy: req.body.dCreatedBy || 'system',
            tActionAt: result.tUpdatedAt
        });

        res.json(result);
    } catch (error) {
        console.error('Error updating KPI:', error);
        res.status(500).json({ 
            message: "Error updating KPI", 
            error: error.message 
        });
    }
};

exports.deleteKPI = async (req, res) => {
    try {
        const result = await kpiService.deleteKPI(req.params.id);

        
        res.json(result);
    } catch (error) {
        if (error.message === 'KPI not found') {
            res.status(404).json({ message: error.message });
        } else {
            res.status(500).json({ message: "Error deleting KPI", error: error.message });
        }
    }
};

exports.deactivateKPI = async (req, res) => {
    try {
        const result = await kpiService.deactivateKPI(req.params.id);

        // Log the deactivation action
        await logService.logAdminAction({
            dActionLocation_ID: result.dKPI_ID,
            dActionLocation: 'KPI',
            dActionType: 'MODIFIED',
            dActionBy: req.body.dCreatedBy || 'system',
            tActionAt: result.tUpdatedAt
        });

        res.json(result);
    } catch (error) {
        if (error.message === 'KPI not found') {
            res.status(404).json({ message: error.message });
        } else {
            res.status(500).json({ 
                message: "Error deactivating KPI", 
                error: error.message 
            });
        }
    }
};

exports.reactivateKPI = async (req, res) => {
    try {
        const result = await kpiService.reactivateKPI(req.params.id);

        // Log the reactivation action
        await logService.logAdminAction({
            dActionLocation_ID: result.dKPI_ID,
            dActionLocation: 'KPI',
            dActionType: 'MODIFIED',
            dActionBy: req.body.dCreatedBy || 'system',
            tActionAt: result.tUpdatedAt
        });

        res.json(result);
    } catch (error) {
        if (error.message === 'KPI not found') {
            res.status(404).json({ message: error.message });
        } else {
            res.status(500).json({ 
                message: "Error reactivating KPI", 
                error: error.message 
            });
        }
    }
};

exports.bulkReactivateKPIs = async (req, res) => {
    try {
        const result = await kpiService.bulkReactivateKPIs(req.body.kpiIds);

         // Log the creation action
        await logService.logAdminAction({
            dActionLocation_ID: result.dKPI_ID,
            dActionLocation: 'KPI',
            dActionType: 'ACTIVATED',
            dActionBy: req.body.dCreatedBy
        });

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

