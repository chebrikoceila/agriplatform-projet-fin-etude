const mongoose = require('mongoose');
const Parcelle = require('../models/Parcel');
const Alerte = require('../models/Alert');

exports.getDashboardStats = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const parcelles = await Parcelle.find({ userId }, { ndviMoyen: 1, ndwiMoyen: 1, createdAt: 1, analytics: 1 });

        const parcelleIds = parcelles.map((p) => p._id);
        const activeAlertsCount = await Alerte.countDocuments({
            parcelleId: { $in: parcelleIds },
            isRead: false
        });

        // 7 days ago date
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Trend calculations
        const oldParcellesCount = parcelles.filter(p => p.createdAt <= sevenDaysAgo).length;
        const trendParcelles = parcelles.length - oldParcellesCount;

        // Current NDVI
        const ndviValues = parcelles
            .map((p) => p.ndviMoyen)
            .filter((value) => typeof value === 'number' && !Number.isNaN(value));
        const ndviGlobalAvg = ndviValues.length
            ? ndviValues.reduce((sum, value) => sum + value, 0) / ndviValues.length
            : null;

        // Old NDVI (rough estimation based on analytics)
        let oldNdviSum = 0;
        let oldNdviCount = 0;
        let oldStressCount = 0;

        for (const p of parcelles) {
            if (p.analytics && p.analytics.length > 0) {
                // Find point closest to 7 days ago (we just take any before 7 days for simplicity if we only have sporadic data)
                const pastPoint = p.analytics.slice().reverse().find(a => new Date(a.date) <= sevenDaysAgo);
                if (pastPoint) {
                    if (typeof pastPoint.ndvi === 'number') {
                        oldNdviSum += pastPoint.ndvi;
                        oldNdviCount++;
                    }
                    if (typeof pastPoint.ndwi === 'number' && pastPoint.ndwi < 0.2) {
                        oldStressCount++;
                    }
                }
            }
        }
        const oldNdviAvg = oldNdviCount > 0 ? oldNdviSum / oldNdviCount : ndviGlobalAvg;
        const trendNdvi = ndviGlobalAvg && oldNdviAvg ? ((ndviGlobalAvg - oldNdviAvg) / oldNdviAvg) * 100 : 0;

        const stressHydriqueCount = parcelles.filter(
            (p) => typeof p.ndwiMoyen === 'number' && p.ndwiMoyen < 0.2
        ).length;
        const trendStressHydrique = stressHydriqueCount - oldStressCount;

        // Old Alerts
        const oldAlertsCount = await Alerte.countDocuments({
            parcelleId: { $in: parcelleIds },
            isRead: false,
            date: { $lte: sevenDaysAgo }
        });
        const trendAlerts = activeAlertsCount - oldAlertsCount;

        res.json({
            activeParcelles: parcelles.length,
            trendParcelles,
            ndviGlobalAvg,
            trendNdvi,
            stressHydriqueCount,
            trendStressHydrique,
            activeAlertsCount,
            trendAlerts
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

exports.getDashboardSerie = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const parcelles = await Parcelle.find({ userId }, { analytics: 1 });
        
        // Aggregate daily average over the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const seriesMap = new Map();
        
        parcelles.forEach(p => {
            if (!p.analytics) return;
            p.analytics.forEach(a => {
                const dateObj = new Date(a.date);
                if (dateObj >= thirtyDaysAgo) {
                    const formattedDate = dateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
                    if (!seriesMap.has(formattedDate)) {
                        seriesMap.set(formattedDate, { date: formattedDate, ndviSum: 0, ndviCount: 0, ndwiSum: 0, ndwiCount: 0 });
                    }
                    const stat = seriesMap.get(formattedDate);
                    if (typeof a.ndvi === 'number') { stat.ndviSum += a.ndvi; stat.ndviCount++; }
                    if (typeof a.ndwi === 'number') { stat.ndwiSum += a.ndwi; stat.ndwiCount++; }
                }
            });
        });
        
        const daysList = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
            
            // Only add days that have data to make chart look continuous or include all days.
            // In the reference, it shows ~12 continuous days (19 Avr to 30 Avr).
            // Let's include all days in the last 30 that actually have some data, or just all days.
            const data = seriesMap.get(dateStr);
            if (data) {
                daysList.push({
                    date: dateStr,
                    ndvi: data.ndviCount ? data.ndviSum / data.ndviCount : null,
                    ndwi: data.ndwiCount ? data.ndwiSum / data.ndwiCount : null,
                });
            } else {
                daysList.push({
                    date: dateStr,
                    ndvi: null,
                    ndwi: null,
                });
            }
        }
        
        res.json(daysList);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

exports.getDashboardStatusDistribution = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const distribution = await Parcelle.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId) } },
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);
        
        const formatStatus = {
            'ok': 'Saines',
            'warning': 'Modérées',
            'critical': 'Stress'
        };
        
        const result = distribution.map(d => ({
            name: formatStatus[d._id] || d._id,
            value: d.count
        }));
        
        // Ensure all statuses exist even if 0
        const existingStatuses = result.map(r => r.name);
        ['Saines', 'Modérées', 'Stress'].forEach(status => {
            if (!existingStatuses.includes(status)) {
                result.push({ name: status, value: 0 });
            }
        });
        
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

exports.getDashboardWilayas = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const totalCount = await Parcelle.countDocuments({ userId });
        
        const distribution = await Parcelle.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId) } },
            { $group: { _id: "$wilaya", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        
        const result = distribution.map(d => ({
            name: d._id || 'Non spécifié',
            value: totalCount > 0 ? Math.round((d.count / totalCount) * 100) : 0
        }));
        
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};
