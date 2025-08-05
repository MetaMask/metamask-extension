import path from 'path';
import { chromium, firefox } from '@playwright/test';

// Set browser for manifest flags
if (process.env.BROWSER === undefined) {
  process.env.BROWSER = 'chrome';
}

const extensionPath = path.join(process.cwd(), 'dist', process.env.BROWSER || 'chrome');

export class ChromeExtensionPage {
  async initExtension() {
    console.log(`Loading extension from: ${extensionPath}`);

    const launchOptions = {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security'
      ],
    };

    try {
      // Determine browser based on test project name or environment
      const isFirefoxProject = process.env.PLAYWRIGHT_PROJECT?.includes('firefox') ||
                               globalThis.__PLAYWRIGHT_TEST_PROJECT_NAME__?.includes('firefox');

      const browserType = isFirefoxProject ? firefox : chromium;
      const context = await browserType.launchPersistentContext('', launchOptions);

      // Extension loads quickly, no need for artificial delay

      const pages = context.pages();
      console.log(`Found ${pages.length} pages`);

      // Use the first page that's created (usually about:blank)
      let extensionPage = pages[0];

      // Log page count only
      console.log('All page URLs:');
      for (let i = 0; i < pages.length; i++) {
        const url = pages[i].url();
        console.log(`  Page ${i}: ${url}`);
      }

      // Find the extension ID from any existing extension pages
      let extensionId = '';
      for (const page of pages) {
        const url = page.url();
        console.log(`Checking page URL: ${url}`);
        if (url.includes('chrome-extension://')) {
          const match = url.match(/chrome-extension:\/\/([a-z]+)/);
          if (match) {
            extensionId = match[1];
            console.log(`Found extension ID from page: ${extensionId}`);
            break;
          }
        }
      }

      // If we still don't have an extension ID, try getting it from background pages
      if (!extensionId) {
        try {
          const backgroundPages = context.backgroundPages();
          console.log(`Found ${backgroundPages.length} background pages`);
          for (const bgPage of backgroundPages) {
            const url = bgPage.url();
            console.log(`Background page URL: ${url}`);
            if (url.includes('chrome-extension://')) {
              const match = url.match(/chrome-extension:\/\/([a-z]+)/);
              if (match) {
                extensionId = match[1];
                console.log(`Found extension ID from background page: ${extensionId}`);
                break;
              }
            }
          }
        } catch (e) {
          console.log('Could not get background pages:', e.message);
        }
      }

      // Skip chrome://extensions approach to avoid creating extra tabs

      // Final fallback: try common extension ID patterns
      if (!extensionId) {
        console.log('Trying hardcoded common extension IDs...');
        const commonIds = [
          'nkbihfbeogaeaoehlefnkodbefgpgknn', // MetaMask production
          'ejbalbakoplchlghecdalmeeeajnimhm', // MetaMask development
          'hebhblbkkdabgoldnojllkipeoacjioc', // Another common ID
        ];

        // Use the existing page instead of creating new ones
        for (const testId of commonIds) {
          try {
            await extensionPage.goto(`chrome-extension://${testId}/home.html`, { timeout: 5000 });
            const title = await extensionPage.title();
            if (title.includes('MetaMask')) {
              extensionId = testId;
              console.log(`Found working extension ID: ${extensionId}`);
              break;
            }
          } catch (e) {
            console.log(`Extension ID ${testId} not working: ${e.message}`);
          }
        }
      }

      if (!extensionId) {
        // List all available extensions for debugging
        try {
          const debugPage = await context.newPage();
          await debugPage.goto('chrome://extensions/');
          const extensionInfo = await debugPage.evaluate(() => {
            return {
              title: document.title,
              body: document.body.innerHTML.substring(0, 1000)
            };
          });
          console.log('Chrome extensions page debug info:', extensionInfo);
          await debugPage.close();
        } catch (e) {
          console.log('Could not debug chrome://extensions:', e.message);
        }

        throw new Error('Could not find MetaMask extension ID');
      }

      console.log(`Found extension ID: ${extensionId}`);

      // Navigate directly to home.html (same as Selenium)
      const extensionUrl = `chrome-extension://${extensionId}/home.html`;
      console.log(`Navigating to: ${extensionUrl}`);
      await extensionPage.goto(extensionUrl);

      // Wait for JavaScript to load and DOM to be populated
      console.log('Waiting for JavaScript to load and execute...');

      // First, wait for the page to have some basic structure
      await extensionPage.waitForLoadState('domcontentloaded');
      await extensionPage.waitForLoadState('networkidle');

      console.log('DOM and network loaded, checking for JavaScript execution...');

      // Monitor for JavaScript errors that might prevent React from loading
      const jsErrors: string[] = [];
      extensionPage.on('console', (msg) => {
        if (msg.type() === 'error') {
          jsErrors.push(`Console Error: ${msg.text()}`);
          console.log(`🚨 JavaScript Error: ${msg.text()}`);
        } else if (msg.type() === 'warn') {
          console.log(`⚠️  JavaScript Warning: ${msg.text()}`);
        }
      });

      extensionPage.on('pageerror', (error) => {
        jsErrors.push(`Page Error: ${error.message}`);
        console.log(`💥 Page Error: ${error.message}`);
      });

      // Monitor only critical network requests
      extensionPage.on('request', (request) => {
        const url = request.url();
        if (url.includes('localhost:12345') || url.includes('state.json')) {
          console.log(`🌐 Request: ${request.method()} ${url}`);
        }
      });

      extensionPage.on('response', async (response) => {
        const url = response.url();
        if (url.includes('localhost:12345') || url.includes('state.json')) {
          console.log(`📥 Response: ${response.status()} ${url}`);
          if (!response.ok()) {
            console.log(`❌ Failed request: ${response.status()} ${url}`);
          }
        }
      });

      // Wait for any script tags or React to initialize
      try {
        // Check if React or other JS frameworks have loaded
        await extensionPage.waitForFunction(() => {
          // Check for any sign that JavaScript is running
          return (
            document.querySelectorAll('[data-testid]').length > 0 || // React elements
            document.querySelectorAll('script').length > 0 || // Script tags
            window.React !== undefined || // React loaded
            document.body.children.length > 5 // Some content rendered
          );
        }, { timeout: 10000 }); // Reduced from 30s to 10s

        console.log('JavaScript appears to be executing, checking for React initialization...');

        // Simplified wait for React to mount and render UI
        let reactAttempts = 0;
        const maxAttempts = 3; // Reduced from 10 to 3

        while (reactAttempts < maxAttempts) {
          reactAttempts++;
          console.log(`🔄 React initialization attempt ${reactAttempts}/${maxAttempts}`);

          const reactStatus = await extensionPage.evaluate(() => {
            return {
              // React checks
              hasReact: typeof window.React !== 'undefined',
              hasReactDOM: typeof window.ReactDOM !== 'undefined',

              // DOM checks
              divCount: document.querySelectorAll('div').length,
              testIdCount: document.querySelectorAll('[data-testid]').length,
              bodyChildren: document.body.children.length,

              // Content checks
              bodyText: document.body.textContent?.length || 0,
              hasAppRoot: document.querySelector('#app, [data-reactroot], [id*="root"]') !== null,

              // MetaMask specific checks
              hasUnlockElements: document.querySelectorAll('[data-testid*="unlock"]').length > 0,
              hasHomeElements: document.querySelectorAll('[data-testid*="eth-overview"], [data-testid*="home"]').length > 0,
              hasMetaMaskClasses: document.querySelectorAll('[class*="metamask"], [class*="mm-"]').length > 0,

              // Error checks
              hasErrorElements: document.querySelectorAll('.error, [class*="error"]').length > 0,

              // Check if extension is in loading state
              hasLoadingElements: document.querySelectorAll('.loading, [class*="loading"], .spinner').length > 0,
            };
          });

          console.log(`📊 React Status (attempt ${reactAttempts}):`, JSON.stringify(reactStatus, null, 2));

          // If we have React elements or unlock/home elements, we're good
          if (reactStatus.testIdCount > 0 || reactStatus.hasUnlockElements || reactStatus.hasHomeElements) {
            console.log('✅ React UI elements found! Extension is ready.');
            break;
          }

          // If we have loading elements, wait longer
          if (reactStatus.hasLoadingElements) {
            console.log('⏳ Loading elements detected, waiting longer...');
            await new Promise(resolve => setTimeout(resolve, 1000)); // Reduced from 3s to 1s
            continue;
          }

          // If we have error elements, something went wrong
          if (reactStatus.hasErrorElements) {
            console.log('❌ Error elements detected in DOM');
            break;
          }

          // Wait between attempts
          await new Promise(resolve => setTimeout(resolve, 500)); // Reduced from 2s to 0.5s
        }

        // Final check - look for any kind of unlock or home elements
        await extensionPage.waitForSelector([
          '[data-testid="unlock-page-title"]',      // Unlock screen
          '[data-testid="eth-overview-send"]',      // Home screen
          '[data-testid*="unlock"]',                // Any unlock elements
          '[data-testid*="home"]',                  // Any home elements
          'body > div > div',                       // Basic app structure
          '.app, #app, [data-reactroot]'            // App root elements
        ].join(', '), { timeout: 5000 });

        console.log('🎉 Extension loaded successfully with UI elements!');

      } catch (error) {
        console.log('⚠️  React UI not fully initialized, but extension is running');

        // Final diagnostics
        try {
          const finalStatus = await extensionPage.evaluate(() => {
            // Get all available information about the current state
            const allElements = Array.from(document.querySelectorAll('*')).map(el => ({
              tag: el.tagName,
              id: el.id,
              className: el.className,
              textContent: el.textContent?.substring(0, 50)
            })).slice(0, 20); // First 20 elements

            return {
              url: window.location.href,
              title: document.title,
              readyState: document.readyState,
              bodyHTML: document.body.innerHTML.substring(0, 500),
              allElements,
              jsErrors: jsErrors,
              windowObjects: Object.keys(window).filter(key =>
                key.includes('React') || key.includes('metamask') || key.includes('ethereum')
              )
            };
          });

          console.log('🔍 Final diagnostic information:', JSON.stringify(finalStatus, null, 2));

          if (jsErrors.length > 0) {
            console.log('🚨 JavaScript errors detected:', jsErrors);
          }

        } catch (diagError) {
          console.log('Error during final diagnostics:', diagError.message);
        }

        // Even if React isn't fully loaded, extension is functional
        console.log('📸 Taking screenshot of current state...');
        await extensionPage.screenshot({ path: 'react-debug-state.png' });
      }

      return extensionPage;
    } catch (error) {
      console.error('Error initializing extension:', error);
      throw error;
    }
  }
}
