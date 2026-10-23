# Weather

A fast, accessible weather web app with live conditions, a 24-hour forecast chart, a 10-day outlook and air quality for any place on Earth.

Live: <https://weatherapp-47ce4.web.app>

## Features

- **Your location or any city.** Uses geolocation, with city search and autocomplete (keyboard friendly; press <kbd>/</kbd> to focus).
- **Current conditions.** Temperature, feels-like, wind speed, direction and gusts, humidity, UV index, US AQI with PM2.5, pressure, visibility, precipitation, and sunrise/sunset with daylight length.
- **Hourly forecast.** The next 24 hours with a temperature curve and chance of precipitation.
- **10-day forecast.** Temperature range bars on a shared scale. Tap a day to see its details.
- **°C / °F.** Switching units converts every value on the page. The default follows your locale and your choice is remembered.
- **Saved places.** Star a place to pin it to the top bar.
- **Shareable URLs.** The current place is kept in the URL (`?lat=…&lon=…&name=…`).
- **Living background.** The sky changes with the weather and time of day (rain, snow, stars at night) and respects `prefers-reduced-motion`.
- **Installable and works offline.** A web app manifest plus a service worker that keeps the last forecast available offline.
- **Robust.** Requests time out, superseded requests are cancelled, results are cached for 10 minutes, data refreshes itself every 15 minutes, and errors come with a retry button.

## Tech

- [Vite](https://vite.dev) + TypeScript (strict), with no UI framework. The production JS bundle is about 11 KB gzipped.
- [Open-Meteo](https://open-meteo.com) for the forecast, air quality and geocoding. It is free and needs no API key.
- [BigDataCloud](https://www.bigdatacloud.com/) client-side reverse geocoding to name your current location.
- Vitest + jsdom for tests, ESLint (typescript-eslint) and Prettier for code quality, and GitHub Actions CI.

## Getting started

Requires Node.js 20 or later.

```bash
npm install
npm run dev        # start the dev server at http://localhost:5173
```

| Script            | What it does                                  |
| ----------------- | --------------------------------------------- |
| `npm run dev`     | Dev server with hot reload                    |
| `npm run build`   | Type-check, then build to `dist/`             |
| `npm run preview` | Serve the production build locally            |
| `npm test`        | Run the unit tests                            |
| `npm run lint`    | Lint with ESLint                              |
| `npm run format`  | Format with Prettier                          |
| `npm run check`   | Lint + typecheck + tests + build (same as CI) |

## Deploying

`dist/` is a fully static site, so any static host works. Firebase Hosting is preconfigured, including security headers, a Content Security Policy and long-lived caching for hashed assets:

```bash
npm run build
npx firebase-tools deploy --only hosting
```

## Project structure

```
src/
  main.ts          app bootstrap, state and event wiring
  api.ts           Open-Meteo / geocoding clients, caching, timeouts
  transform.ts     raw API responses → view model
  weatherCodes.ts  WMO code → label, icon, theme
  units.ts         unit conversion and formatting
  time.ts          timezone-aware date formatting
  storage.ts       persisted settings, saved places, URL state
  icons.ts         SVG weather icons and UI glyphs
  ui/              rendering and the search combobox
  styles.css
public/            manifest, icons, service worker
tests/             unit tests
```

## Credits

Made by [Ioannis Lazaridis](https://github.com/IoannisLazaridis). Weather data by [Open-Meteo](https://open-meteo.com/) under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
