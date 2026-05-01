const toCardinal = (degrees) => {
    if (degrees == null || Number.isNaN(degrees)) return null;
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
    const index = Math.round((((degrees % 360) + 360) % 360) / 45) % 8;
    return directions[index];
};

const getCentroid = (geometry) => {
    const ring = geometry?.coordinates?.[0] || [];
    if (!ring.length) throw new Error('Geometry de parcelle invalide');
    const points = ring.length > 1 ? ring.slice(0, -1) : ring;
    const sums = points.reduce((acc, [lng, lat]) => [acc[0] + lng, acc[1] + lat], [0, 0]);
    return { lon: sums[0] / points.length, lat: sums[1] / points.length };
};

const buildDailyEntry = (daily, index) => ({
    date: daily.time[index],
    tempMin: daily.temperature_2m_min?.[index] ?? null,
    tempMax: daily.temperature_2m_max?.[index] ?? null,
    precipMm: daily.precipitation_sum?.[index] ?? null,
    etp: daily.et0_fao_evapotranspiration?.[index] ?? null,
    humidity: daily.relative_humidity_2m_mean?.[index] ?? null,
    windSpeed: daily.wind_speed_10m_max?.[index] ?? null,
    windDirectionDeg: daily.wind_direction_10m_dominant?.[index] ?? null,
    windDirection: toCardinal(daily.wind_direction_10m_dominant?.[index] ?? null),
});

const getParcelleWeather = async (geometry) => {
    const { lat, lon } = getCentroid(geometry);
    const params = new URLSearchParams({
        latitude: String(lat),
        longitude: String(lon),
        timezone: 'auto',
        past_days: '10',
        forecast_days: '6',
        daily: [
            'temperature_2m_max',
            'temperature_2m_min',
            'precipitation_sum',
            'et0_fao_evapotranspiration',
            'relative_humidity_2m_mean',
            'wind_speed_10m_max',
            'wind_direction_10m_dominant'
        ].join(',')
    });

    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
    if (!response.ok) {
        throw new Error(`Open-Meteo indisponible (${response.status})`);
    }

    const payload = await response.json();
    if (!payload?.daily?.time?.length) {
        throw new Error('Données météo indisponibles pour cette parcelle');
    }

    const daily = payload.daily;
    const entries = daily.time.map((_, index) => buildDailyEntry(daily, index));
    const today = new Date().toISOString().slice(0, 10);
    const todayIndex = entries.findIndex((day) => day.date === today);
    const pivot = todayIndex >= 0 ? todayIndex : Math.max(entries.length - 6, 0);

    const last7 = entries.slice(Math.max(0, pivot - 6), pivot + 1);
    const rainfallLast7DaysMm = last7.reduce((sum, day) => sum + (day.precipMm || 0), 0);

    let dryDays = 0;
    for (let i = entries.length - 1; i >= 0; i -= 1) {
        if ((entries[i].precipMm || 0) <= 0.2) dryDays += 1;
        else break;
    }

    return {
        location: { lat, lon },
        rainfallLast7DaysMm: Number(rainfallLast7DaysMm.toFixed(1)),
        dryDays,
        currentDay: entries[pivot] ?? null,
        next5Days: entries.slice(pivot + 1, pivot + 6),
        daily: entries
    };
};

module.exports = { getParcelleWeather };
