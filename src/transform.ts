import type {
  AirQuality,
  AirQualityResponse,
  DailyPoint,
  ForecastResponse,
  HourlyPoint,
  Place,
  WeatherReport,
} from './types';

const HOURS_SHOWN = 24;

/** Index of the hourly slot containing `time` (the last slot that starts at or before it). */
export function currentHourIndex(hourlyTimes: number[], time: number): number {
  let index = 0;
  for (let i = 0; i < hourlyTimes.length; i++) {
    const t = hourlyTimes[i];
    if (t === undefined || t > time) break;
    index = i;
  }
  return index;
}

export function buildHourly(raw: ForecastResponse['hourly'], fromIndex: number, count = HOURS_SHOWN): HourlyPoint[] {
  const points: HourlyPoint[] = [];
  const end = Math.min(raw.time.length, fromIndex + count);
  for (let i = fromIndex; i < end; i++) {
    points.push({
      time: raw.time[i]!,
      temperature: raw.temperature_2m[i]!,
      precipitationChance: raw.precipitation_probability[i] ?? null,
      code: raw.weather_code[i]!,
      isDay: raw.is_day[i] === 1,
    });
  }
  return points;
}

export function buildDaily(raw: ForecastResponse['daily']): DailyPoint[] {
  return raw.time.map((time, i) => ({
    time,
    code: raw.weather_code[i]!,
    max: raw.temperature_2m_max[i]!,
    min: raw.temperature_2m_min[i]!,
    sunrise: raw.sunrise[i]!,
    sunset: raw.sunset[i]!,
    uvIndexMax: raw.uv_index_max[i] ?? null,
    precipitationSum: raw.precipitation_sum[i] ?? null,
    precipitationChance: raw.precipitation_probability_max[i] ?? null,
    windSpeedMax: raw.wind_speed_10m_max[i] ?? null,
  }));
}

export function buildAirQuality(raw: AirQualityResponse | null): AirQuality | null {
  if (!raw?.current) return null;
  const { us_aqi, pm2_5, pm10 } = raw.current;
  if (us_aqi == null && pm2_5 == null && pm10 == null) return null;
  return { usAqi: us_aqi ?? null, pm25: pm2_5 ?? null, pm10: pm10 ?? null };
}

export function buildReport(
  place: Place,
  forecast: ForecastResponse,
  airQuality: AirQualityResponse | null,
  fetchedAt = Date.now(),
): WeatherReport {
  const c = forecast.current;
  const hourIndex = currentHourIndex(forecast.hourly.time, c.time);

  return {
    place,
    timezone: forecast.timezone,
    fetchedAt,
    current: {
      time: c.time,
      temperature: c.temperature_2m,
      feelsLike: c.apparent_temperature,
      humidity: c.relative_humidity_2m,
      precipitation: c.precipitation,
      cloudCover: c.cloud_cover,
      pressure: c.pressure_msl,
      windSpeed: c.wind_speed_10m,
      windGusts: c.wind_gusts_10m,
      windDirection: c.wind_direction_10m,
      visibility: forecast.hourly.visibility[hourIndex] ?? null,
      uvIndex: forecast.hourly.uv_index[hourIndex] ?? null,
      isDay: c.is_day === 1,
      code: c.weather_code,
    },
    hourly: buildHourly(forecast.hourly, hourIndex),
    daily: buildDaily(forecast.daily),
    airQuality: buildAirQuality(airQuality),
  };
}
