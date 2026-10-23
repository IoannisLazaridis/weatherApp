# Weather

[![CI](https://github.com/IoannisLazaridis/weatherApp/actions/workflows/ci.yml/badge.svg)](https://github.com/IoannisLazaridis/weatherApp/actions/workflows/ci.yml)
[![CodeQL](https://github.com/IoannisLazaridis/weatherApp/actions/workflows/codeql.yml/badge.svg)](https://github.com/IoannisLazaridis/weatherApp/actions/workflows/codeql.yml)
[![Deploy to Pages](https://github.com/IoannisLazaridis/weatherApp/actions/workflows/pages.yml/badge.svg)](https://github.com/IoannisLazaridis/weatherApp/actions/workflows/pages.yml)
[![Live demo](https://img.shields.io/badge/live-demo-2563eb?logo=github)](https://ioannislazaridis.github.io/weatherApp/)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)
![Tested with Vitest](https://img.shields.io/badge/tested%20with-Vitest%20%2B%20Playwright-6e9f18?logo=vitest&logoColor=white)
![Weather data: Open-Meteo](https://img.shields.io/badge/data-Open--Meteo-ff8c00)
![No API key](https://img.shields.io/badge/API%20key-not%20needed-brightgreen)

A fast, accessible weather web app with live conditions, a 24-hour forecast chart, a 10-day outlook and air quality for any place on Earth.

**Live demo: <https://ioannislazaridis.github.io/weatherApp/>**

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
- Vitest + jsdom unit tests with coverage, Playwright end-to-end tests on desktop and mobile, ESLint (typescript-eslint) and Prettier.

## Getting started

Requires Node.js 22.12 or later.

```bash
npm install
npm run dev        # start the dev server at http://localhost:5173
```

| Script                  | What it does                                  |
| ----------------------- | --------------------------------------------- |
| `npm run dev`           | Dev server with hot reload                    |
| `npm run build`         | Type-check, then build to `dist/`             |
| `npm run preview`       | Serve the production build locally            |
| `npm test`              | Run the unit tests                            |
| `npm run test:coverage` | Unit tests with a coverage report             |
| `npm run test:e2e`      | Playwright end-to-end tests                   |
| `npm run lint`          | Lint with ESLint                              |
| `npm run format`        | Format with Prettier                          |
| `npm run check`         | Lint + typecheck + tests + build (same as CI) |

## Continuous integration

Every push and pull request runs on GitHub Actions:

| Workflow                               | What it checks                                                                                                                                                                          |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [CI](.github/workflows/ci.yml)         | ESLint, Prettier, TypeScript, unit tests on Node 22 and 24 with coverage thresholds, Playwright e2e on desktop and mobile, production build with a bundle-size report, Lighthouse audit |
| [CodeQL](.github/workflows/codeql.yml) | Security analysis on every PR and weekly                                                                                                                                                |
| [Deploy](.github/workflows/deploy.yml) | Preview URL for each pull request, production deploy from `master`                                                                                                                      |
| [Dependabot](.github/dependabot.yml)   | Weekly grouped dependency updates, monthly Actions updates                                                                                                                              |

Coverage and bundle-size tables appear in each run's summary. Playwright reports, coverage HTML and Lighthouse results are uploaded as artifacts.

## Deploying

### GitHub Pages (live demo)

The [GitHub Pages workflow](.github/workflows/pages.yml) builds the app and publishes it to <https://ioannislazaridis.github.io/weatherApp/> whenever `master` changes. Enable it once under **Settings → Pages → Source: GitHub Actions**. The build uses relative URLs, so the same output also works at a domain root.

### Firebase Hosting (optional)

`dist/` is a fully static site, so any static host works. Firebase Hosting is also preconfigured, including security headers, a Content Security Policy and long-lived caching for hashed assets:

```bash
npm run build
npx firebase-tools deploy --only hosting
```

#### Automatic Firebase deploys

To let the Deploy workflow publish for you, run `npx firebase-tools init hosting:github` once (it creates a service account), or add a Firebase service account JSON yourself as the repository secret `FIREBASE_SERVICE_ACCOUNT`. Until that secret exists, the workflow skips deploying.

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
e2e/               Playwright end-to-end tests (with mocked APIs)
```

## Credits

Made by [Ioannis Lazaridis](https://github.com/IoannisLazaridis). Weather data by [Open-Meteo](https://open-meteo.com/) under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
