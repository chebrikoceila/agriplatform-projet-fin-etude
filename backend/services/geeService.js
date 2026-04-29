const ee = require('@google/earthengine');

const getNDVITimeSeries = (geometry, startDate, endDate) => {
    return new Promise((resolve, reject) => {
        const polygon = ee.Geometry.Polygon(geometry.coordinates);
        
        // Collection Sentinel-2
        const collection = ee.ImageCollection('COPERNICUS/S2_SR')
            .filterBounds(polygon)
            .filterDate(startDate, endDate)
            .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 30));

        // Mapper le calcul du NDVI sur toute la collection
        // Mapper le calcul du NDVI et NDWI sur toute la collection
const timeSeries = collection.map(image => {
    // 1. Calcul des deux indices
    const ndvi = image.normalizedDifference(['B8', 'B4']).rename('ndvi');
    const ndwi = image.normalizedDifference(['B8', 'B11']).rename('ndwi'); // B8=NIR, B11=SWIR pour Sentinel-2
    
    // 2. Combiner les deux indices dans une seule image multi-bandes
    const imageWithIndices = ee.Image([ndvi, ndwi]);
    
    // 3. Appliquer le reducer sur l'image combinée (1 seul calcul pour les 2 indices !)
    const stats = imageWithIndices.reduceRegion({
        reducer: ee.Reducer.mean(),
        geometry: polygon,
        scale: 10,
        maxPixels: 1e9 // Bonne pratique GEE pour éviter les erreurs sur les grandes parcelles
    });
    
    // 4. Retourner les deux valeurs avec la date
    return ee.Feature(null, {
        'ndvi': stats.get('ndvi'),
        'ndwi': stats.get('ndwi'),
        'date': image.date().format('YYYY-MM-DD')
    });
});

        // Extraire les données vers le serveur Node
        timeSeries.getInfo((data, err) => {
            if (err) return reject(err);
            const formatted = data.features.map(f => f.properties);
            resolve(formatted);
        });
    });
};

module.exports = { getNDVITimeSeries };