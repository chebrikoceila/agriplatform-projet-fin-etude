const Parcelle = require('../models/Parcel');
const geeService = require('../services/geeService');
const { getParcelleWeather } = require('../services/weatherService');

const toIsoDate = (value) => new Date(value).toISOString().split('T')[0];

const sixMonthsAgoIso = () => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return toIsoDate(sixMonthsAgo);
};

const getPlantationStartIso = (datePlantation) => {
    if (!datePlantation) return null;
    const parsed = new Date(datePlantation);
    return Number.isNaN(parsed.getTime()) ? null : toIsoDate(parsed);
};

const sanitizeDatePlantation = (rawDate) => {
    if (!rawDate) return null;
    const parsed = new Date(rawDate);
    if (Number.isNaN(parsed.getTime())) return null;
    const today = new Date();
    const parsedIso = toIsoDate(parsed);
    const todayIso = toIsoDate(today);
    return parsedIso > todayIso ? todayIso : parsedIso;
};

const getSeriesWithFallback = async (geometry, startDate, endDate) => {
    const primary = await geeService.getNDVITimeSeries(geometry, startDate, endDate);
    if (primary.length > 0) return primary;

    const fallbackStart = sixMonthsAgoIso();
    if (fallbackStart === startDate) return primary;

    return geeService.getNDVITimeSeries(geometry, fallbackStart, endDate);
};

// CREATE
exports.createParcelle = async (req, res) => {
    try {
        const payload = { ...req.body };
        // Associer la parcelle à l'utilisateur connecté
        payload.userId = req.auth.userId;
        if (Object.prototype.hasOwnProperty.call(payload, 'datePlantation')) {
            payload.datePlantation = sanitizeDatePlantation(payload.datePlantation);
        }
        const nouvelleParcelle = new Parcelle(payload);
        const saved = await nouvelleParcelle.save();

        // LOGIQUE CROP MONITORING : Calculer les indices immédiatement après l'ajout
        const today = toIsoDate(new Date());
        const startDate = getPlantationStartIso(saved.datePlantation) || sixMonthsAgoIso();

        // On lance le calcul GEE
        const stats = await getSeriesWithFallback(saved.geometry, startDate, today);

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

// READ ALL — filtré par utilisateur connecté
exports.getAllParcelles = async (req, res) => {
    try {
        const parcelles = await Parcelle.find({ userId: req.auth.userId }).sort({ createdAt: -1 });
        res.json(parcelles);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET ONE + STATS GEE (La logique métier principale)
exports.getParcelleDetails = async (req, res) => {
    try {
        const parcelle = await Parcelle.findOne({ _id: req.params.id, userId: req.auth.userId });
        if (!parcelle) return res.status(404).send("Parcelle non trouvée");

        // On récupère les données NDVI depuis la date de plantation (ou 6 mois)
        const today = toIsoDate(new Date());
        const startDate = getPlantationStartIso(parcelle.datePlantation) || sixMonthsAgoIso();

        const [stats, latestSentinelImageDate] = await Promise.all([
            getSeriesWithFallback(parcelle.geometry, startDate, today),
            geeService.getLatestSentinelImageDate(parcelle.geometry)
        ]);

        res.json({ info: parcelle, analytics: stats, latestSentinelImageDate });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getParcelleTimeSeries = async (req, res) => {
    try {
        const parcelle = await Parcelle.findOne({ _id: req.params.id, userId: req.auth.userId });
        if (!parcelle) return res.status(404).send("Parcelle non trouvée");

        const todayIso = toIsoDate(new Date());
        const fallbackStart = getPlantationStartIso(parcelle.datePlantation) || sixMonthsAgoIso();

        const startDate = req.query.debut || fallbackStart;
        const endDate = req.query.fin || todayIso;

        const stats = await getSeriesWithFallback(parcelle.geometry, startDate, endDate);
        res.json({ parcelleId: parcelle._id, startDate, endDate, analytics: stats });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getParcelleWeather = async (req, res) => {
    try {
        const parcelle = await Parcelle.findOne({ _id: req.params.id, userId: req.auth.userId });
        if (!parcelle) return res.status(404).send("Parcelle non trouvée");
        const meteo = await getParcelleWeather(parcelle.geometry);
        res.json({ parcelleId: parcelle._id, ...meteo });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateParcelle = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (Object.prototype.hasOwnProperty.call(payload, 'datePlantation')) {
        payload.datePlantation = sanitizeDatePlantation(payload.datePlantation);
    }
    // Empêcher la modification de userId
    delete payload.userId;
    const updated = await Parcelle.findOneAndUpdate(
        { _id: req.params.id, userId: req.auth.userId },
        payload,
        { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Parcelle non trouvée ou accès refusé' });
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


// DELETE — vérifie l'appartenance avant suppression
exports.deleteParcelle = async (req, res) => {
    try {
        const deleted = await Parcelle.findOneAndDelete({ _id: req.params.id, userId: req.auth.userId });
        if (!deleted) return res.status(404).json({ error: 'Parcelle non trouvée ou accès refusé' });
        res.json({ message: "Parcelle supprimée avec succès" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};