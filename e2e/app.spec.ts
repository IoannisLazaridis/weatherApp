import { expect, test } from '@playwright/test';
import { mockApis } from './mocks';

test.describe('weather app', () => {
  test('loads the forecast for the device location', async ({ page, context }) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 37.98, longitude: 23.72 });
    await mockApis(page);
    await page.goto('/');

    await expect(page.locator('.hero-name')).toHaveText('Athens');
    await expect(page.locator('.hero-degrees')).toHaveText('21°');
    await expect(page.locator('.hero-condition')).toHaveText('Partly cloudy');
    await expect(page.locator('.hour')).toHaveCount(24);
    await expect(page.locator('.day')).toHaveCount(10);
    await expect(page.getByRole('heading', { name: 'Air quality' })).toBeVisible();
    await expect(page).toHaveTitle(/21° Athens/);
    await expect(page).toHaveURL(/lat=37\.98/);
  });

  test('falls back to a default city when location is denied', async ({ page }) => {
    await mockApis(page);
    await page.goto('/');
    await expect(page.locator('.hero-name')).toHaveText('Athens');
    await expect(page.getByRole('alert')).toContainText(/location/i);
  });

  test('searches for a city with the keyboard', async ({ page }) => {
    await mockApis(page);
    await page.goto('/?lat=37.98&lon=23.72&name=Athens');
    await expect(page.locator('.hero-name')).toHaveText('Athens');

    await page.keyboard.press('/');
    await page.keyboard.type('Thess');
    const options = page.getByRole('option');
    await expect(options).toHaveCount(2);
    await page.keyboard.press('ArrowDown');
    await expect(options.nth(1)).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('Enter');

    await expect(page.locator('.hero-name')).toHaveText('Thessalon');
    await expect(page.locator('.hero-region')).toHaveText('Ontario, Canada');
    await expect(page).toHaveURL(/name=Thessalon/);
  });

  test('switches units and remembers the choice', async ({ page }) => {
    await mockApis(page);
    await page.goto('/?lat=37.98&lon=23.72&name=Athens');
    await expect(page.locator('.hero-degrees')).toHaveText('21°');

    await page.getByRole('button', { name: '°F' }).click();
    await expect(page.locator('.hero-degrees')).toHaveText('71°');
    await expect(page.getByRole('button', { name: '°F' })).toHaveAttribute('aria-pressed', 'true');

    await page.reload();
    await expect(page.locator('.hero-degrees')).toHaveText('71°');
  });

  test('saves places as favourites', async ({ page }) => {
    await mockApis(page);
    await page.goto('/?lat=37.98&lon=23.72&name=Athens');
    await page.getByRole('button', { name: 'Save this place' }).click();

    const saved = page.getByRole('navigation', { name: 'Saved places' });
    await expect(saved.getByRole('button', { name: 'Athens' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Remove from saved places' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await page.reload();
    await expect(saved.getByRole('button', { name: 'Athens' })).toBeVisible();
  });

  test('expands a day for details', async ({ page }) => {
    await mockApis(page);
    await page.goto('/?lat=37.98&lon=23.72&name=Athens');
    const day = page.locator('.day').nth(2);
    await day.locator('summary').click();
    await expect(day.locator('.day-details')).toBeVisible();
    await expect(day.locator('.day-details')).toContainText('Light rain');
  });

  test('shows an error with a working retry', async ({ page }) => {
    await mockApis(page, { forecastStatus: 503 });
    await page.goto('/?lat=37.98&lon=23.72&name=Athens');
    const alert = page.getByRole('alert');
    await expect(alert).toContainText('Service unavailable');

    await page.unrouteAll({ behavior: 'ignoreErrors' });
    await mockApis(page);
    await alert.getByRole('button', { name: 'Try again' }).click();
    await expect(page.locator('.hero-degrees')).toHaveText('21°');
    await expect(alert).toBeHidden();
  });

  test('has no horizontal overflow', async ({ page }) => {
    await mockApis(page);
    await page.goto('/?lat=37.98&lon=23.72&name=Athens');
    await expect(page.locator('.hero-degrees')).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
