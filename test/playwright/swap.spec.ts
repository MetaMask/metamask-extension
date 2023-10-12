import { test, chromium, type BrowserContext, Page } from '@playwright/test';
import assert from 'assert';
import { MetaMaskExtension } from './support/MetaMaskExtension';
const MM_EXTENSION_FOLDER = require('path').join(
  __dirname,
  '../../dist/chrome',
);

let MMExtension: MetaMaskExtension;

test.beforeAll(async () => {
  const MMContext: BrowserContext = await newBrowserExtensionContext();
  MMExtension = new MetaMaskExtension(MMContext);
  await MMExtension.openTab();
  await MMExtension.initialOnBoarding();
  await MMExtension.changeNetwork({
    name: 'Tenderly',
    url: 'https://rpc.tenderly.co/fork/e3a0948b-a9df-46be-a45b-afa572ea62ee',
    chainID: '1',
    symbol: 'ETH',
  });
});

test('Swap ETH to DAI', async () => {
  await MMExtension.swap({ from: 'ETH', to: 'DAI', qty: '.001' });
});

test('Swap ETH to WETH', async () => {
  await MMExtension.swap({ from: 'ETH', to: 'WETH', qty: '1' });
});

test('Swap WETH to ETH', async () => {
  await MMExtension.swap({ from: 'WETH', to: 'ETH', qty: '1' });
});

test('Swap DAI to USDC', async () => {
  await MMExtension.swap({ from: 'DAI', to: 'USDC', qty: '1' });
});

async function newBrowserExtensionContext(): Promise<BrowserContext> {
  const userDataDir = '';
  const browserOptions = {
    headless: false,
    args: [
      `--disable-extensions-except=${MM_EXTENSION_FOLDER}`,
      `--load-extension=${MM_EXTENSION_FOLDER}`,
    ],
  };
  const newBrowserContext = await chromium.launchPersistentContext(
    userDataDir,
    browserOptions,
  );
  try {
    // MetaMask extension (manifiest v2) is auto-started in a new tab
    let [backgroundPage] = newBrowserContext.backgroundPages();
    if (!backgroundPage)
      backgroundPage = await newBrowserContext.waitForEvent('backgroundpage', {
        timeout: 5000,
      });
    // extension ID does not change between dfferent contexts of same browser
    MetaMaskExtension.extensionId = backgroundPage.url().split('/')[2];
    assert(
      MetaMaskExtension.extensionId !== undefined,
      `Extension ID not found`,
    );
  } catch (err) {
    console.log(err);
    await newBrowserContext.close();
    throw new Error(err);
  }
  return newBrowserContext;
}
