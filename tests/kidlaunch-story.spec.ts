import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:8766';

test.describe('KidLaunch Story Page', () => {

  test('page loads with correct title', async ({ page }) => {
    await page.goto(`${BASE}/kidlaunch/`);
    await expect(page).toHaveTitle(/KidLaunch/);
  });

  test('hero section displays cleanly without overlap', async ({ page }) => {
    await page.goto(`${BASE}/kidlaunch/`);
    
    const heroTitle = page.locator('.hero-title');
    await expect(heroTitle).toBeVisible();
    
    // The title text must be fully readable
    const titleBox = await heroTitle.boundingBox();
    expect(titleBox).not.toBeNull();
    expect(titleBox!.width).toBeGreaterThan(200);
    
    // The hero content should be fully within viewport
    const heroContent = page.locator('.hero-content');
    const contentBox = await heroContent.boundingBox();
    expect(contentBox).not.toBeNull();
    
    const viewport = page.viewportSize();
    // Content should not extend beyond viewport right edge
    expect(contentBox!.x + contentBox!.width).toBeLessThanOrEqual(viewport!.width + 10);
  });

  test('all images load without broken src', async ({ page }) => {
    await page.goto(`${BASE}/kidlaunch/`);
    
    // Wait for visible images to load (skip lazy-loaded below-fold images)
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(2000);
    
    const images = page.locator('img');
    const count = await images.count();
    expect(count).toBeGreaterThanOrEqual(8);
    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const src = await img.getAttribute('src');
      const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
      expect(naturalWidth, `Image broken: ${src}`).toBeGreaterThan(0);
    }
  });

  test('screenshot rows display side-by-side on desktop', async ({ page }) => {
    await page.goto(`${BASE}/kidlaunch/`);
    
    const rows = page.locator('.screenshot-row');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);
    
    // First screenshot row should have 2 children at desktop width
    const firstRow = rows.first();
    const children = firstRow.locator('> *');
    const childCount = await children.count();
    expect(childCount).toBe(2);
    
    // Both images in the row should be visible and not overlapping
    const imgs = firstRow.locator('img');
    const imgCount = await imgs.count();
    expect(imgCount).toBe(2);
    for (let i = 0; i < imgCount; i++) {
      await expect(imgs.nth(i)).toBeVisible();
    }
  });

  test('feature cards grid renders correctly', async ({ page }) => {
    await page.goto(`${BASE}/kidlaunch/`);
    
    const cards = page.locator('.feature-card');
    const cardCount = await cards.count();
    expect(cardCount).toBe(8);
    
    // Each card should have a heading and description
    for (let i = 0; i < cardCount; i++) {
      const card = cards.nth(i);
      const heading = card.locator('h4');
      await expect(heading).toBeVisible();
      const title = await heading.textContent();
      expect(title?.length).toBeGreaterThan(1);
    }
  });

  test('metrics grid has all 8 stats', async ({ page }) => {
    await page.goto(`${BASE}/kidlaunch/`);
    
    const metrics = page.locator('.metric-card');
    const count = await metrics.count();
    expect(count).toBe(8);
    
    const nums = page.locator('.metric-num');
    const numCount = await nums.count();
    expect(numCount).toBe(8);
  });

  test('nav back link works', async ({ page }) => {
    await page.goto(`${BASE}/kidlaunch/`);
    
    const backLink = page.locator('.nav-back');
    await expect(backLink).toBeVisible();
    const href = await backLink.getAttribute('href');
    expect(href).toBe('../');
  });

  test('CTA buttons are present and clickable', async ({ page }) => {
    await page.goto(`${BASE}/kidlaunch/`);
    
    const tryBtn = page.locator('a:has-text("Try KidLaunch")');
    await expect(tryBtn).toBeVisible();
    const tryHref = await tryBtn.getAttribute('href');
    expect(tryHref).toContain('kidlaunch.beets3d.com');
    
    const backBtn = page.locator('a:has-text("Back to IdeaFactory")');
    await expect(backBtn).toBeVisible();
  });

  test('responsive: screenshot rows stack on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 900 });
    await page.goto(`${BASE}/kidlaunch/`);
    
    // At 400px, grid-template-columns should be 1fr (single column)
    const row = page.locator('.screenshot-row').first();
    const children = row.locator('> *');
    const childCount = await children.count();
    expect(childCount).toBe(2);
    
    // Verify they're stacked vertically:
    // In a single-column grid, each child takes full width
    const box1 = await children.nth(0).boundingBox();
    const box2 = await children.nth(1).boundingBox();
    expect(box1).not.toBeNull();
    expect(box2).not.toBeNull();
    // Second child's top should be below the first child's top
    expect(box2!.y).toBeGreaterThan(box1!.y);
  });
});
