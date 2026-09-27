/**
 * ─── KisanAI Weather Service ──────────────────────────────────────────
 * Isolated weather module communicating with Open-Meteo APIs:
 * - Open-Meteo Forecast API (no API key required)
 * - Open-Meteo Geocoding API (no API key required)
 * 
 * Provides live current farm conditions, 7-day forecast,
 * and agronomic crop spray / disease vulnerability advisories.
 */

export interface LocationData {
  id?: number;
  name: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface CurrentWeather {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  rainChance: number;
  weatherCode: number;
  condition: string;
  windSpeed: number;
  iconName: 'Sun' | 'CloudSun' | 'Cloud' | 'CloudFog' | 'CloudDrizzle' | 'CloudRain' | 'CloudLightning' | 'Snowflake';
  locationName: string;
  latitude: number;
  longitude: number;
  updatedAt: string;
}

export interface DailyForecast {
  date: string;
  dayName: string;
  formattedDate: string;
  tempMax: number;
  tempMin: number;
  rainChance: number;
  weatherCode: number;
  condition: string;
  iconName: 'Sun' | 'CloudSun' | 'Cloud' | 'CloudFog' | 'CloudDrizzle' | 'CloudRain' | 'CloudLightning' | 'Snowflake';
}

export interface AgronomicAdvisory {
  status: 'optimal' | 'caution' | 'warning';
  headline: string;
  sprayAdvice: string;
  diseaseRisk: string;
}

export interface WeatherData {
  current: CurrentWeather;
  forecast: DailyForecast[];
  advisory: AgronomicAdvisory;
}

const STORAGE_KEY_LOCATION = 'kisanai_weather_location';

/**
 * Default agricultural baseline location (Ludhiana, Punjab - known agricultural hub)
 */
export const DEFAULT_FARM_LOCATION: LocationData = {
  name: 'Ludhiana',
  region: 'Punjab',
  country: 'India',
  latitude: 30.901,
  longitude: 75.8573,
};

/**
 * Preset popular agricultural regions for one-click weather switching
 */
export const POPULAR_AGRI_REGIONS: LocationData[] = [
  { name: 'Ludhiana', region: 'Punjab', country: 'India', latitude: 30.901, longitude: 75.8573 },
  { name: 'Karnal', region: 'Haryana', country: 'India', latitude: 29.6857, longitude: 76.9905 },
  { name: 'Nashik', region: 'Maharashtra', country: 'India', latitude: 19.9975, longitude: 73.7898 },
  { name: 'Indore', region: 'Madhya Pradesh', country: 'India', latitude: 22.7196, longitude: 75.8577 },
  { name: 'Varanasi', region: 'Uttar Pradesh', country: 'India', latitude: 25.3176, longitude: 82.9739 },
  { name: 'Guntur', region: 'Andhra Pradesh', country: 'India', latitude: 16.3067, longitude: 80.4365 },
];

/**
 * Maps WMO weather code to human-readable condition and appropriate icon
 */
export function interpretWeatherCode(code: number): {
  condition: string;
  iconName: CurrentWeather['iconName'];
} {
  switch (code) {
    case 0:
      return { condition: 'Clear Sky', iconName: 'Sun' };
    case 1:
      return { condition: 'Mainly Clear', iconName: 'CloudSun' };
    case 2:
      return { condition: 'Partly Cloudy', iconName: 'CloudSun' };
    case 3:
      return { condition: 'Overcast', iconName: 'Cloud' };
    case 45:
    case 48:
      return { condition: 'Fog & Mist', iconName: 'CloudFog' };
    case 51:
    case 53:
    case 55:
      return { condition: 'Light Drizzle', iconName: 'CloudDrizzle' };
    case 56:
    case 57:
      return { condition: 'Freezing Drizzle', iconName: 'Snowflake' };
    case 61:
      return { condition: 'Slight Rain', iconName: 'CloudRain' };
    case 63:
      return { condition: 'Moderate Rain', iconName: 'CloudRain' };
    case 65:
      return { condition: 'Heavy Rain', iconName: 'CloudRain' };
    case 66:
    case 67:
      return { condition: 'Freezing Rain', iconName: 'Snowflake' };
    case 71:
    case 73:
    case 75:
    case 77:
      return { condition: 'Snowfall', iconName: 'Snowflake' };
    case 80:
    case 81:
    case 82:
      return { condition: 'Rain Showers', iconName: 'CloudRain' };
    case 85:
    case 86:
      return { condition: 'Snow Showers', iconName: 'Snowflake' };
    case 95:
      return { condition: 'Thunderstorm', iconName: 'CloudLightning' };
    case 96:
    case 99:
      return { condition: 'Thunderstorm with Hail', iconName: 'CloudLightning' };
    default:
      return { condition: 'Partly Cloudy', iconName: 'CloudSun' };
  }
}

/**
 * Calculates agronomic advisory based on meteorological parameters
 */
function generateAgronomicAdvisory(
  temp: number,
  humidity: number,
  rainChance: number,
  windSpeed: number
): AgronomicAdvisory {
  if (rainChance >= 50) {
    return {
      status: 'warning',
      headline: 'High Rain Risk: Postpone Chemical Applications',
      sprayAdvice:
        'Chance of precipitation is above 50%. Postpone pesticide, fungicide, and foliar spray operations to prevent chemical runoff and wasted inputs.',
      diseaseRisk:
        'Persistent wetness elevates risk of bacterial blight, fungal damping-off, and sheath rot. Ensure drainage ditches are clear.',
    };
  }

  if (humidity >= 80 && temp >= 22) {
    return {
      status: 'caution',
      headline: 'Elevated Foliar Disease Vulnerability',
      sprayAdvice:
        'Atmospheric moisture exceeds 80%. If applying preventative fungicides, do so early in the morning once dew evaporates.',
      diseaseRisk:
        'Warm and humid conditions accelerate spore germination for bacterial leaf blight and rust. Conduct visual field inspections.',
    };
  }

  if (windSpeed >= 20) {
    return {
      status: 'caution',
      headline: 'High Wind Drift Warning',
      sprayAdvice:
        `Wind speed is ${Math.round(windSpeed)} km/h. Avoid foliar or backpack spraying until wind subsides below 15 km/h to prevent spray drift onto neighboring crops.`,
      diseaseRisk: 'Rapid wind drying reduces leaf wetness duration, lowering immediate spore incubation.',
    };
  }

  return {
    status: 'optimal',
    headline: 'Favorable Spraying & Field Work Window',
    sprayAdvice:
      'Current meteorological conditions (moderate wind, stable temperature, and low rain chance) are ideal for foliar nutrition, pesticide applications, and general field operations.',
    diseaseRisk:
      'Normal baseline disease pressure. Maintain scheduled irrigation intervals and crop scouting.',
  };
}

/**
 * Retrieves the stored weather location from localStorage or default.
 */
export function getStoredWeatherLocation(): LocationData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOCATION);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number') {
        return parsed;
      }
    }
  } catch (e) {
    // Ignore parse errors
  }
  return DEFAULT_FARM_LOCATION;
}

/**
 * Saves selected weather location to localStorage.
 */
export function setStoredWeatherLocation(location: LocationData): void {
  try {
    localStorage.setItem(STORAGE_KEY_LOCATION, JSON.stringify(location));
  } catch (e) {
    console.error('Failed to store location', e);
  }
}

/**
 * Searches locations using Open-Meteo Geocoding API.
 */
export async function searchLocations(query: string): Promise<LocationData[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    const endpoint = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      query.trim()
    )}&count=6&language=en&format=json`;

    const res = await fetch(endpoint);
    if (!res.ok) throw new Error(`Geocoding failed with status ${res.status}`);

    const data = await res.json();
    if (!data.results || !Array.isArray(data.results)) return [];

    return data.results.map((item: any) => ({
      id: item.id,
      name: item.name,
      region: item.admin1 || item.admin2 || '',
      country: item.country || '',
      latitude: item.latitude,
      longitude: item.longitude,
    }));
  } catch (error) {
    console.error('[WeatherService] Error searching locations:', error);
    return [];
  }
}

/**
 * Fetches live weather data from Open-Meteo for given coordinates.
 */
export async function fetchWeatherData(
  lat: number,
  lon: number,
  locationName: string = 'Current Farm Location'
): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Open-Meteo API returned error status: ${response.status}`);
  }

  const raw = await response.json();
  const currentRaw = raw.current || {};
  const dailyRaw = raw.daily || {};

  const currentCode = currentRaw.weather_code ?? 0;
  const currentInterpretation = interpretWeatherCode(currentCode);
  const currentTemp = Math.round(currentRaw.temperature_2m ?? 25);
  const apparentTemp = Math.round(currentRaw.apparent_temperature ?? currentTemp);
  const humidity = Math.round(currentRaw.relative_humidity_2m ?? 50);
  const windSpeed = Math.round((currentRaw.wind_speed_10m ?? 0) * 10) / 10;

  // Today's rain chance from daily forecast index 0
  const rainChanceToday =
    dailyRaw.precipitation_probability_max && dailyRaw.precipitation_probability_max.length > 0
      ? Math.round(dailyRaw.precipitation_probability_max[0] ?? 0)
      : 0;

  const current: CurrentWeather = {
    temperature: currentTemp,
    apparentTemperature: apparentTemp,
    humidity,
    rainChance: rainChanceToday,
    weatherCode: currentCode,
    condition: currentInterpretation.condition,
    windSpeed,
    iconName: currentInterpretation.iconName,
    locationName,
    latitude: lat,
    longitude: lon,
    updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  // Build 7-day forecast
  const forecast: DailyForecast[] = [];
  const times: string[] = dailyRaw.time || [];
  const maxTemps: number[] = dailyRaw.temperature_2m_max || [];
  const minTemps: number[] = dailyRaw.temperature_2m_min || [];
  const weatherCodes: number[] = dailyRaw.weather_code || [];
  const rainProbs: number[] = dailyRaw.precipitation_probability_max || [];

  const count = Math.min(times.length, 7);
  for (let i = 0; i < count; i++) {
    const isoDate = times[i];
    const d = new Date(isoDate + 'T00:00:00');
    const dayName =
      i === 0
        ? 'Today'
        : i === 1
        ? 'Tomorrow'
        : d.toLocaleDateString(undefined, { weekday: 'short' });
    const formattedDate = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const wCode = weatherCodes[i] ?? 0;
    const interp = interpretWeatherCode(wCode);

    forecast.push({
      date: isoDate,
      dayName,
      formattedDate,
      tempMax: Math.round(maxTemps[i] ?? currentTemp),
      tempMin: Math.round(minTemps[i] ?? currentTemp - 5),
      rainChance: Math.round(rainProbs[i] ?? 0),
      weatherCode: wCode,
      condition: interp.condition,
      iconName: interp.iconName,
    });
  }

  const advisory = generateAgronomicAdvisory(currentTemp, humidity, rainChanceToday, windSpeed);

  return {
    current,
    forecast,
    advisory,
  };
}

/**
 * Requests browser geolocation coordinates and fetches weather.
 */
export async function getBrowserLocationWeather(): Promise<WeatherData> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const weather = await fetchWeatherData(lat, lon, 'My Farm (GPS Location)');
          resolve(weather);
        } catch (err) {
          reject(err);
        }
      },
      (err) => {
        reject(err);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  });
}
