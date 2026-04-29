const ee = require('@google/earthengine');
const path = require('path');

// REMPLACE par le chemin réel de ton fichier JSON téléchargé depuis Google Cloud
const PRIVATE_KEY = require('../config/agritech-494012-9f3856aee583.json');

const initializeGEE = () => {
    console.log("Tentative de connexion à Google Earth Engine...");

    ee.data.authenticateViaPrivateKey(
        PRIVATE_KEY,
        () => {
            console.log('GEE : Authentification réussie via Service Account.');
            ee.initialize(
                null, 
                null, 
                () => {
                    console.log('GEE : Moteur initialisé et prêt pour les calculs.');
                }, 
                (err) => {
                    console.error('GEE : Erreur lors de l\'initialisation :', err);
                }
            );
        },
        (err) => {
            console.error('GEE : Erreur d\'authentification :', err);
        }
    );
};

module.exports = initializeGEE;