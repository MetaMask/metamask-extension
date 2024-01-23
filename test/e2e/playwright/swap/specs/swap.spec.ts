import { test } from '@playwright/test';

import { ChromeExtensionPage } from '../support/extension-page';
import { SignUpPage } from '../support/signup-page';
import { NetworkController } from '../support/network-controller-page';
import { SwapPage } from '../support/swap-page';

let swapPage, networkController;

test.beforeEach('Initialize extension and import wallet', async () => {
  const extension = new ChromeExtensionPage();
  const page = await extension.initExtension();

  const signUp = new SignUpPage(page);
  await signUp.importWallet();

  networkController = new NetworkController(page);
  swapPage = new SwapPage(page);

  await networkController.addCustomNetwork({
    name: 'Tenderly',
    url: 'https://rpc.tenderly.co/fork/c2e7fb02-9c2e-40ee-b911-ebf5b0326f96',
    chainID: '1',
    symbol: 'ETH',
  });
});

test('Swap ETH to DAI - Switch to Arbitrum and fetch quote - Switch ETH - WETH', async () => {
  await swapPage.fetchQuote({ to: 'DAI', qty: '.001' });
  await swapPage.swap();
  await swapPage.waitForTransactionToComplete();

  await networkController.addPopularNetwork();
  await swapPage.fetchQuote({ to: 'USDC', qty: '.001' });
  await swapPage.waitForInsufficentBalance();
  await swapPage.gotBack();

  /* BUGBUG #22559
  await networkController.selectNetwork('Tenderly');
  await swapPage.fetchQuote({ to: 'WETH', qty: '.001' });
  await swapPage.swap();
  await swapPage.waitForTransactionToComplete();
  */
});

test('Swap WETH to ETH - Switch to Avalanche and fetch quote - Switch DAI - USDC', async () => {
  await swapPage.fetchQuote({ from: 'ETH', to: 'WETH', qty: '.001' });
  await swapPage.switchTokens();
  await swapPage.swap();
  await swapPage.waitForTransactionToComplete();

  await networkController.addPopularNetwork();
  await swapPage.fetchQuote({ to: 'USDC', qty: '.001' });
  await swapPage.waitForInsufficentBalance();
  await swapPage.gotBack();

  /* BUGBUG #22559
  await networkController.selectNetwork('Tenderly');
  await swapPage.importTokens();
  await swapPage.fetchQuote({ from: 'DAI', to: 'USDC', qty: '1' });
  await swapPage.swap();
  await swapPage.waitForTransactionToComplete();
  */
});
