import { test } from '@playwright/test';

import { ChromeExtensionPage } from './support/extension-page';
import { SignUpPage } from './support/signup-page';
import { NetworkController } from './support/network-controller-page';
import { SwapPage } from './support/swap-page';

let swapPage, networkController;

test.beforeAll('Initialize extension and import wallet', async () => {
  const extension = new ChromeExtensionPage();
  const page = await extension.initExtension();

  const signUp = new SignUpPage(page);
  await signUp.importWallet();

  networkController = new NetworkController(page);
  swapPage = new SwapPage(page);
});

test('Switch to Tenderly', async () => {
  await networkController.addCustomNetwork({
    name: 'Tenderly',
    url: 'https://rpc.tenderly.co/fork/e3a0948b-a9df-46be-a45b-afa572ea62ee',
    chainID: '1',
    symbol: 'ETH',
  });
});

test('Swap ETH to DAI', async () => {
  await swapPage.fetchQuote({ to: 'DAI', qty: '.001' });
  await swapPage.swap();
  await swapPage.waitForTransactionToComplete();
});

test('Switch to Arbitrum and fetch quote', async () => {
  await networkController.addPopularNetwork();
  await swapPage.fetchQuote({ to: 'USDC', qty: '.001' });
  await swapPage.waitForInsufficentBalance();
  await swapPage.gotBack();
  await networkController.selectNetwork('Tenderly');
});

test('Swap ETH to WETH', async () => {
  await swapPage.fetchQuote({ to: 'WETH', qty: '.001' });
  await swapPage.swap();
  await swapPage.waitForTransactionToComplete();
});

test('Switch to Avalanche and fetch quote', async () => {
  await networkController.addPopularNetwork();
  await swapPage.fetchQuote({ to: 'USDC', qty: '.001' });
  await swapPage.waitForInsufficentBalance();
  await swapPage.gotBack();
  await networkController.selectNetwork('Tenderly');
});

test('Swap WETH to ETH', async () => {
  await swapPage.fetchQuote({ from: 'WETH', to: 'ETH', qty: '.001' });
  await swapPage.swap();
  await swapPage.waitForTransactionToComplete();
});

test('Switch to BNB Chain and fetch quote', async () => {
  await networkController.addPopularNetwork();
  await swapPage.fetchQuote({ to: 'USDC', qty: '.001' });
  await swapPage.waitForInsufficentBalance();
  await swapPage.gotBack();
  await networkController.selectNetwork('Tenderly');
});

test('Swap DAI to USDC', async () => {
  await swapPage.fetchQuote({ from: 'DAI', to: 'USDC', qty: '1' });
  await swapPage.swap();
  await swapPage.waitForTransactionToComplete();
});
