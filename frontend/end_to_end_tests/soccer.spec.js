import { test, expect } from '@playwright/test';

test.describe('Soccer Page E2E', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Navigate to the SWA emulator's mock auth page
    // Replace 'aad' with whatever provider you use (github, twitter, etc.)
    await page.goto('/.auth/login/aad');

    // 2. Fill out the mock SWA login form
    await page.fill('#userId', 'test-user-123');
    await page.fill('#userDetails', 'testuser@example.com');

    // If your app requires specific roles, add them here
    // await page.fill('#userRoles', 'authenticated, member');

    await page.click('button:has-text("Login")');

    // 3. Wait to be redirected back to the app
    await page.waitForURL('**/');
  });

  test('user can log in, load the soccer page, and view live database odds', async ({
    page,
  }) => {
    // Navigate to your specific page
    await page.goto('/soccer');

    // Assert the page loaded
    await expect(
      page.getByRole('heading', { name: 'Soccer Matches' }),
    ).toBeVisible();

    // In an E2E test, we are hitting the REAL backend and REAL database.
    // Wait for the actual data to render on the screen.
    // We look for the "Click for more bets" text which is inside your SoccerCard
    await expect(page.getByText('Click for more bets ▼').first()).toBeVisible({
      timeout: 10000,
    });

    // You can also assert that at least one match loaded correctly
    const cards = page.locator('.MuiCard-root');
    await expect(cards).toHaveCountGreaterThan(0);
  });
});
