import { type Config, type Scenario } from 'artillery';
import { Page } from 'playwright';
import { expect } from '@playwright/test';
import { config as dotenvConfig } from 'dotenv';

// Load environment variables from .env file
dotenvConfig();

/**
 * Artillery + Playwright Load Testing for SLCM Login
 * 
 * Test Flow:
 * 1. Navigate to https://slcm.pusilkom.com
 * 2. Click "Login" button in navbar
 * 3. Redirect to SSO login page
 * 4. Fill username and password from environment variables
 * 5. Click "Sign In" button
 */

export const config: Config = {
  target: process.env.TARGET_URL || 'https://slcm.pusilkom.com',
  
  // Load test phases - adjust duration and arrivalRate as needed
  // For debug: duration: 10, arrivalRate: 1
  // For light: duration: 30, arrivalRate: 1
  // For heavy: duration: 60, arrivalRate: 5-10
  phases: [
    {
      duration: 30,
      arrivalRate: 2,
      name: 'POC test - 2 users per second'
    }
  ],
  
  engines: {
    playwright: {
      // Enable trace recording for debugging
      // View traces at: https://artillery.io/cloud
      trace: true,
      
      // Browser configuration
      launchOptions: {
        headless: process.env.IS_HEADLESS !== 'false',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      }
    }
  },
  
  // Environment variables for credentials
  variables: {
    username: '{{ $env.SLCM_USERNAME }}',
    password: '{{ $env.SLCM_PASSWORD }}',
    target: '{{ $env.TARGET_URL }}'
  }
};

export const scenarios: Scenario[] = [
  {
    engine: 'playwright',
    testFunction: slcmLoginTest,
    name: 'SLCM Login Journey'
  }
];

/**
 * SLCM Login Test Function
 * 
 * @param page - Playwright Page object
 * @param vuContext - Virtual User context containing variables
 * @param events - Event emitter for custom metrics
 * @param test - Test utilities for step reporting
 */
async function slcmLoginTest(
  page: Page, 
  vuContext: any, 
  events: any, 
  test: any
) {
  const { username, password, target } = vuContext.vars;
  const baseUrl = target || process.env.TARGET_URL || 'https://slcm.pusilkom.com';
  const startTime = Date.now();
  const userId = username || 'unknown';
  
  console.log(`[${userId}] Starting SLCM login test...`);
  
  try {
    // Step 1: Navigate to SLCM homepage
    await test.step('Navigate to SLCM homepage', async () => {
      console.log(`[${userId}] Navigating to ${baseUrl}...`);
      await page.goto(baseUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });
      
      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle');
      console.log(`[${userId}] ✓ Homepage loaded`);
    });
    
    // Step 2: Click Login button and wait for SSO redirect
    const ssoRedirectStart = Date.now();
    await test.step('Click login and redirect to SSO', async () => {
      console.log(`[${userId}] Clicking Login button...`);
      
      await page.click('text=Login', { timeout: 10000 });
      
      // Wait for redirect to SSO page (deterministic wait)
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('networkidle');
      
      // Verify we're on SSO page (login.ui.ac.id)
      await expect(page).toHaveURL(/login\.ui\.ac\.id/, { timeout: 10000 });
      
      const ssoRedirectTime = Date.now() - ssoRedirectStart;
      events.emit('customStat', { stat: 'sso_redirect_time', value: ssoRedirectTime });
      console.log(`[${userId}] ✓ Redirected to SSO login.ui.ac.id (${ssoRedirectTime}ms)`);
    });
    
    // Step 3: Fill login credentials
    await test.step('Fill login credentials', async () => {
      console.log(`[${userId}] Filling credentials...`);
      
      // Fill username
      const usernameInput = page.locator('input[placeholder*="Username"], input[name="username"]').first();
      await usernameInput.waitFor({ state: 'visible', timeout: 10000 });
      await usernameInput.fill(username);
      
      // Fill password
      const passwordInput = page.locator('input[placeholder*="Password"], input[name="password"], input[type="password"]').first();
      await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
      await passwordInput.fill(password);
      
      console.log(`[${userId}] ✓ Credentials filled`);
    });
    
    // Step 4: Submit login and verify success
    const loginStart = Date.now();
    await test.step('Submit login and verify success', async () => {
      console.log(`[${userId}] Submitting login...`);
      
      // Click Sign In button
      await page.click('button:has-text("Sign In")', { timeout: 10000 });
      
      // Wait for navigation after login (deterministic)
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('networkidle');
      
      // Verify successful login by checking URL pattern
      // Should redirect back to SLCM and NOT be on login.ui.ac.id anymore
      await expect(page).toHaveURL(/slcm\.pusilkom\.com/, { 
        timeout: 15000 
      });
      
      // Additional check: Make sure we're NOT on login page anymore
      const currentUrl = page.url();
      if (currentUrl.includes('login.ui.ac.id')) {
        throw new Error('Still on login page - authentication might have failed');
      }
      
      const loginDuration = Date.now() - loginStart;
      events.emit('customStat', { stat: 'login_duration', value: loginDuration });
      
      console.log(`[${userId}] ✓ Login successful! (${loginDuration}ms)`);
      console.log(`[${userId}] Current URL: ${currentUrl}`);
    });
    
    // Calculate total test duration
    const totalDuration = Date.now() - startTime;
    events.emit('customStat', { stat: 'dashboard_load_time', value: totalDuration });
    console.log(`[${userId}] ✓ Test completed in ${totalDuration}ms`);
    
  } catch (error) {
    console.error(`[${userId}] ✗ Test failed:`, error);
    throw error;
  }
}
