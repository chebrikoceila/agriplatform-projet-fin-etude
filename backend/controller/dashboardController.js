const Parcelle = require('../models/Parcel');
const Alerte = require('../models/Alert');

exports.getDashboardStats = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const parcelles = await Parcelle.find({ userId }, { ndviMoyen: 1, ndwiMoyen: 1 });

        // Compter uniquement les alertes liées aux parcelles de cet utilisateur
        const parcelleIds = parcelles.map((p) => p._id);
        const activeAlertsCount = await Alerte.countDocuments({
            parcelleId: { $in: parcelleIds },
            isRead: false
        });

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
