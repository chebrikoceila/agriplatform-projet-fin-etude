const Parcelle = require('../models/Parcel');
const Alerte = require('../models/Alert');

exports.getDashboardStats = async (req, res) => {
    try {
        const parcelles = await Parcelle.find({}, { ndviMoyen: 1, ndwiMoyen: 1 });
        const activeAlertsCount = await Alerte.countDocuments({ isRead: false });

        const ndviValues = parcelles
            .map((p) => p.ndviMoyen)
            .filter((value) => typeof value === 'number' && !Number.isNaN(value));

        const ndviGlobalAvg = ndviValues.length
            ? ndviValues.reduce((sum, value) => sum + value, 0) / ndviValues.length
            : null;

        const stressHydriqueCount = parcelles.filter(
            (p) => typeof p.ndwiMoyen === 'number' && p.ndwiMoyen < 0.2
        ).length;

        res.json({
            activeParcelles: parcelles.length,
            ndviGlobalAvg,
            stressHydriqueCount,
            activeAlertsCount
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
