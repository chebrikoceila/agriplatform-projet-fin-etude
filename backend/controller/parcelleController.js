const Parcelle = require('../models/Parcel');
const geeService = require('../services/geeService');

// CREATE
exports.createParcelle = async (req, res) => {
    try {
        const nouvelleParcelle = new Parcelle(req.body);
        const saved = await nouvelleParcelle.save();

        // LOGIQUE CROP MONITORING : Calculer les indices immédiatement après l'ajout
        const today = new Date().toISOString().split('T')[0];
        let startDate;
        if (saved.datePlantation) {
            startDate = new Date(saved.datePlantation).toISOString().split('T')[0];
        } else {
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            startDate = sixMonthsAgo.toISOString().split('T')[0];
        }

        // On lance le calcul GEE
        const stats = await geeService.getNDVITimeSeries(saved.geometry, startDate, today);

        // On renvoie TOUT : les infos de la parcelle + les données des graphes
    res.status(201).json({
    success: true,
    info: saved,
    analytics: stats,
    // On récupère la dernière valeur du tableau pour afficher la moyenne actuelle
    ndviMoyen: stats.length > 0 ? stats[stats.length - 1].ndvi : 0,
    ndwiMoyen: stats.length > 0 ? stats[stats.length - 1].ndwi : 0 
});
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: err.message });
    }
};

// READ ALL
exports.getAllParcelles = async (req, res) => {
    try {
        const parcelles = await Parcelle.find().sort({ createdAt: -1 });
        res.json(parcelles);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET ONE + STATS GEE (La logique métier principale)
exports.getParcelleDetails = async (req, res) => {
    try {
        const parcelle = await Parcelle.findById(req.params.id);
        if (!parcelle) return res.status(404).send("Parcelle non trouvée");

        // On récupère les données NDVI depuis la date de plantation (ou 6 mois)
        const today = new Date().toISOString().split('T')[0];
        let startDate;
        if (parcelle.datePlantation) {
            startDate = new Date(parcelle.datePlantation).toISOString().split('T')[0];
        } else {
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            startDate = sixMonthsAgo.toISOString().split('T')[0];
        }

        const stats = await geeService.getNDVITimeSeries(parcelle.geometry, startDate, today);

        res.json({ info: parcelle, analytics: stats });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateParcelle = async (req, res) => {
  try {
    const updated = await Parcelle.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) { res.status(400).json({ error: err.message }); }
};

exports.analyzeParcelleStress = async (req, res) => {
    try {
        const result = await geeService.analyzeStress(req.params.id);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};


// DELETE
exports.deleteParcelle = async (req, res) => {
    try {
        await Parcelle.findByIdAndDelete(req.params.id);
        res.json({ message: "Parcelle supprimée avec succès" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};