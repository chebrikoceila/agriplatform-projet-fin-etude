const cron = require('node-cron');
const Parcelle = require('../models/Parcel');
const { analyzeStress } = require('./geeService');

const runStressAnalysisForAllParcelles = async () => {
    const parcelles = await Parcelle.find({});

    for (const parcelle of parcelles) {
        try {
            await analyzeStress(parcelle._id);
        } catch (error) {
            console.error(`Echec analyse stress parcelle ${parcelle._id}:`, error.message);
        }
    }
};

const startStressWorker = () => {
    cron.schedule('0 0 * * *', async () => {
        console.log('Lancement job quotidien analyse stress...');
        await runStressAnalysisForAllParcelles();
    });
};

module.exports = {
    startStressWorker,
    runStressAnalysisForAllParcelles
};
