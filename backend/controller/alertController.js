const Alerte = require('../models/Alert');

exports.listAlerts = async (req, res) => {
    try {
        const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 200;
        const filter = {};
        if (req.query.statut === 'active') {
            filter.isRead = false;
        }

        const alerts = await Alerte.find(filter)
            .populate('parcelleId', 'nom status')
            .sort({ date: -1 })
            .limit(limit);
        res.json(alerts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const alert = await Alerte.findByIdAndUpdate(
            req.params.id,
            { isRead: true },
            { new: true }
        );
        if (!alert) return res.status(404).json({ error: 'Alerte introuvable' });
        res.json(alert);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.deleteAlert = async (req, res) => {
    try {
        const deleted = await Alerte.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: 'Alerte introuvable' });
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.deleteAlerts = async (req, res) => {
    try {
        const mode = req.query.mode || 'read';
        const filter = mode === 'all' ? {} : { isRead: true };
        const result = await Alerte.deleteMany(filter);
        res.json({ success: true, deletedCount: result.deletedCount });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
