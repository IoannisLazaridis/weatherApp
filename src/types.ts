export type UnitSystem = 'metric' | 'imperial';

export interface Place {
  name: string;
  latitude: number;
  longitude: number;
  /** Secondary line, e.g. "Central Macedonia, Greece". */
  region?: string;
  countryCode?: string;
}

export type IconKey =
  | 'clear-day'
  | 'clear-night'
  | 'partly-cloudy-day'
  | 'partly-cloudy-night'
  | 'cloudy'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'freezing-rain'
  | 'snow'
  | 'thunderstorm';

export type ThemeKey = 'clear-day' | 'clear-night' | 'cloudy-day' | 'cloudy-night' | 'rain' | 'snow' | 'storm' | 'fog';

/** Raw response shape of the Open-Meteo forecast endpoint (unixtime format). */
export interface ForecastResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  utc_offset_seconds: number;
  current: {
    time: number;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    is_day: number;
    precipitation: number;
    weather_code: number;
    cloud_cover: number;
    pressure_msl: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    wind_gusts_10m: number;
  };
  hourly: {
    time: number[];
    temperature_2m: number[];
    precipitation_probability: (number | null)[];
    weather_code: number[];
    is_day: number[];
    visibility: (number | null)[];
    uv_index: (number | null)[];
  };
  daily: {
    time: number[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    sunrise: number[];
    sunset: number[];
    uv_index_max: (number | null)[];
    precipitation_sum: (number | null)[];
    precipitation_probability_max: (number | null)[];
    wind_speed_10m_max: (number | null)[];
  };
}

export interface AirQualityResponse {
  current: {
    time: number;
    us_aqi: number | null;
    pm2_5: number | null;
    pm10: number | null;
  };
}

export interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  country_code?: string;
  admin1?: string;
}

/** All values are metric (°C, km/h, mm, m, hPa); conversion happens at render time. */
export interface CurrentConditions {
  time: number;
  temperature: number;
  feelsLike: number;
  humidity: number;
  precipitation: number;
  cloudCover: number;
  pressure: number;
  windSpeed: number;
  windGusts: number;
  windDirection: number;
  visibility: number | null;
  uvIndex: number | null;
  isDay: boolean;
  code: number;
}

export interface HourlyPoint {
  time: number;
  temperature: number;
  precipitationChance: number | null;
  code: number;
  isDay: boolean;
}

export interface DailyPoint {
  time: number;
  code: number;
  max: number;
  min: number;
  sunrise: number;
  sunset: number;
  uvIndexMax: number | null;
  precipitationSum: number | null;
  precipitationChance: number | null;
  windSpeedMax: number | null;
}

export interface AirQuality {
  usAqi: number | null;
  pm25: number | null;
  pm10: number | null;
}

export interface WeatherReport {
  place: Place;
  timezone: string;
  fetchedAt: number;
  current: CurrentConditions;
  hourly: HourlyPoint[];
  daily: DailyPoint[];
  airQuality: AirQuality | null;
}
