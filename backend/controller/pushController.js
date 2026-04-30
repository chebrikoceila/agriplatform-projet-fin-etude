const {
    saveSubscription,
    removeSubscription
} = require('../services/pushService');

exports.subscribe = async (req, res) => {
    try {
        const subscription = req.body;
        if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
            return res.status(400).json({ error: 'Payload subscription invalide.' });
        }

        await saveSubscription(subscription);
        res.status(201).json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.unsubscribe = async (req, res) => {
    try {
        await removeSubscription(req.body?.endpoint);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
