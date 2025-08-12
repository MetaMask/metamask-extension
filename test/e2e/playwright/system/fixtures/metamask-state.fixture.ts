import { test as base } from '@playwright/test';
import { BrowserContext, Page } from '@playwright/test';
import { launchExtensionContext, getExtensionPage } from '../../utils/extension';

export interface MetaMaskState {
  context: BrowserContext;
  extensionPage: Page;
}

export const test = base.extend<MetaMaskState>({
  context: async ({}, use) => {
    const context = await launchExtensionContext();
    await use(context);
    await context.close();
  },

  extensionPage: async ({ context }, use) => {
    const extensionPage = await getExtensionPage(context);
    await use(extensionPage);
  },
});

