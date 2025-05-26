const db = require('../config/db');

class KpiService {
    async getAllKPIs() {
        // Updated to include dKPIEntry_ID
        const [kpis] = await db.execute('SELECT * FROM tbl_kpi ORDER BY tCreatedAt DESC');
        return kpis;
    }

    async getKPIById(id) {
        // Updated to use dKPI_ID
        const [kpi] = await db.execute('SELECT * FROM tbl_kpi WHERE dKPI_ID = ?', [id]);
        if (kpi.length === 0) {
            throw new Error('KPI not found');
        }
        return kpi[0];
    }

  async createKPI(kpiData) {
        const { dKPI_ID, dKPI_Name, dCategory, dDescription, dCalculationBehavior, dCreatedBy } = kpiData;
        
        if (!dKPI_ID || !dKPI_Name || !dCategory || !dCalculationBehavior || !dCreatedBy) {
            throw new Error('Missing required fields');
        }

        // Check if KPI ID already exists
        const [existingKpi] = await db.execute('SELECT dKPI_ID FROM tbl_kpi WHERE dKPI_ID = ?', [dKPI_ID]);
        if (existingKpi.length > 0) {
            throw new Error('KPI ID already exists');
        }

        const [result] = await db.execute(
            'INSERT INTO tbl_kpi (dKPI_ID, dKPI_Name, dCategory, dDescription, dCalculationBehavior, dCreatedBy, tCreatedAt, dStatus) VALUES (?, ?, ?, ?, ?, ?, NOW(), "ACTIVE")',
            [dKPI_ID, dKPI_Name, dCategory, dDescription || '', dCalculationBehavior, dCreatedBy]
        );

        const [newKpi] = await db.execute('SELECT * FROM tbl_kpi WHERE dKPI_ID = ?', [dKPI_ID]);
        return newKpi[0];
    }

    async updateKPI(id, updateData) {
        const { dKPI_Name, dCategory, dCalculationBehavior, dDescription } = updateData;

        if (!dKPI_Name || !dCategory || !dCalculationBehavior) {
            throw new Error('Missing required fields');
        }

        // Check if KPI exists first
        await this.getKPIById(id);

        // Updated UPDATE query
        const updateQuery = `
            UPDATE tbl_kpi 
            SET dKPI_Name = ?, 
                dCategory = ?, 
                dCalculationBehavior = ?, 
                dDescription = ?
            WHERE dKPI_ID = ?`;

        const queryParams = [dKPI_Name, dCategory, dCalculationBehavior, dDescription || '', id];

        const [updated] = await db.execute(updateQuery, queryParams);
        
        if (updated.affectedRows === 0) {
            throw new Error('Failed to update KPI');
        }

        return this.getKPIById(id);
    }

    async deactivateKPI(id) {
        // Check if KPI exists
        await this.getKPIById(id);

        const [result] = await db.execute(
            'UPDATE tbl_kpi SET dStatus = "DEACTIVATED" WHERE dKPI_ID = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            throw new Error('Failed to deactivate KPI');
        }

        // Return updated KPI
        return this.getKPIById(id);
    }

    async reactivateKPI(id) {
        const [result] = await db.execute(
            'UPDATE tbl_kpi SET dStatus = "ACTIVE" WHERE dKPI_ID = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            throw new Error('KPI not found');
        }

        // Return updated KPI
        return this.getKPIById(id);
    }

    async bulkReactivateKPIs(kpiIds) {
        const promises = kpiIds.map(id => this.reactivateKPI(id));
        const results = await Promise.all(promises);
        return {
            message: 'KPIs reactivated successfully',
            updatedKpis: results
        };
    }
}




module.exports = new KpiService();