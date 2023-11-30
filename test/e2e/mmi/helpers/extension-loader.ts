import path from 'path';
import { test as base, chromium } from '@playwright/test';

const extensionPath = path.join(__dirname, '../../../../dist/chrome');

export const test = base.extend({
  // eslint-disable-next-line no-empty-pattern
  context: async ({}, use) => {
    const launchOptions = {
      headless: false,
      args: [`--disable-extensions-except=${extensionPath}`],
    };
    if (process.env.HEADLESS === 'true') {
      launchOptions.args.push('--headless=new');
    }
    const context = await chromium.launchPersistentContext('', launchOptions);
    await use(context);
    await context.close();
  },
});
