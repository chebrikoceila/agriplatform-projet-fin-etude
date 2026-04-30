const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');

const configureWebPush = () => {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const email = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

    if (!publicKey || !privateKey) {
        console.warn('VAPID keys absentes: les notifications push sont désactivées.');
        return;
    }

    webpush.setVapidDetails(email, publicKey, privateKey);
};

const saveSubscription = async (subscription) => {
    return PushSubscription.findOneAndUpdate(
        { endpoint: subscription.endpoint },
        subscription,
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );
};

const removeSubscription = async (endpoint) => {
    if (!endpoint) return;
    await PushSubscription.deleteOne({ endpoint });
};

const sendCriticalAlertNotification = async (alert, parcelle) => {
    const subscriptions = await PushSubscription.find();
    if (!subscriptions.length) return;

    const payload = JSON.stringify({
        title: 'Alerte agronomique critique',
        body: `${parcelle.nom}: ${alert.type} detecte (indice ${alert.valeurIndice.toFixed(2)}).`,
        data: {
            parcelleId: String(parcelle._id),
            alertId: String(alert._id),
            level: 'critical',
            url: '/alertes'
        }
    });

    await Promise.all(subscriptions.map(async (subDoc) => {
        try {
            await webpush.sendNotification(
                {
                    endpoint: subDoc.endpoint,
                    keys: subDoc.keys
                },
                payload
            );
        } catch (error) {
            if (error?.statusCode === 404 || error?.statusCode === 410) {
                await removeSubscription(subDoc.endpoint);
            } else {
                console.error('Erreur envoi notification push:', error.message);
            }
        }
    }));
};

const sendAlertNotification = async ({ title, body, data }) => {
    const subscriptions = await PushSubscription.find();
    if (!subscriptions.length) return;

    const payload = JSON.stringify({ title, body, data });

    await Promise.all(subscriptions.map(async (subDoc) => {
        try {
            await webpush.sendNotification(
                {
                    endpoint: subDoc.endpoint,
                    keys: subDoc.keys
                },
                payload
            );
        } catch (error) {
            if (error?.statusCode === 404 || error?.statusCode === 410) {
                await removeSubscription(subDoc.endpoint);
            } else {
                console.error('Erreur envoi notification push:', error.message);
            }
        }
    }));
};

module.exports = {
    configureWebPush,
    saveSubscription,
    removeSubscription,
    sendCriticalAlertNotification,
    sendAlertNotification
};
