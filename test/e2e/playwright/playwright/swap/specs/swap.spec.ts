import { test } from '@playwright/test';

import { ChromeExtensionPage } from '../pageObjects/extension-page';
import { SignUpPage } from '../pageObjects/signup-page';
import { NetworkController } from '../pageObjects/network-controller-page';
import { SwapPage } from '../pageObjects/swap-page';
import { WalletPage } from '../pageObjects/wallet-page';
import { ActivityListPage } from '../pageObjects/activity-list-page';

let swapPage: SwapPage;
let networkController: NetworkController;
let walletPage: WalletPage;
let activityListPage: ActivityListPage;

test.beforeEach('Initialize extension and import wallet', async () => {
  const extension = new ChromeExtensionPage();
  const page = await extension.initExtension();

  const signUp = new SignUpPage(page);
  await signUp.importWallet();

  networkController = new NetworkController(page);
  swapPage = new SwapPage(page);
  activityListPage = new ActivityListPage(page);

  await networkController.addCustomNetwork({
    name: 'Tenderly',
    url: 'https://rpc.tenderly.co/fork/cdbcd795-097d-4624-aa16-680374d89a43',
    chainID: '1',
    symbol: 'ETH',
  });

  walletPage = new WalletPage(page);
  await walletPage.importTokens();
});

test('Swap ETH to DAI - Switch to Arbitrum and fetch quote - Switch ETH - WETH', async () => {
  await walletPage.selectSwapAction();
  await swapPage.fetchQuote({ to: 'DAI', qty: '.001' });
  await swapPage.swap();
  await swapPage.waitForTransactionToComplete();
  await walletPage.selectActivityList();
  await activityListPage.checkActivityIsConfirmed({
    activity: 'Swap ETH to DAI',
  });

  await networkController.addPopularNetwork('Arbitrum One');
  await walletPage.selectSwapAction();
  await swapPage.fetchQuote({ to: 'USDC', qty: '.001' });
  await swapPage.waitForInsufficentBalance();
  await swapPage.gotBack();

  await networkController.selectNetwork('Tenderly');
  await walletPage.selectSwapAction();
  await swapPage.fetchQuote({ to: 'WETH', qty: '.001' });
  await swapPage.swap();
  await swapPage.waitForTransactionToComplete();
  await walletPage.selectActivityList();
  await activityListPage.checkActivityIsConfirmed({
    activity: 'Swap ETH to WETH',
  });
});

test('Swap WETH to ETH - Switch to Avalanche and fetch quote - Switch DAI - USDC', async () => {
  await walletPage.selectSwapAction();
  await swapPage.fetchQuote({ from: 'ETH', to: 'WETH', qty: '.001' });
  await swapPage.switchTokens();
  await swapPage.swap();
  await swapPage.waitForTransactionToComplete();
  await walletPage.selectActivityList();
  await activityListPage.checkActivityIsConfirmed({
    activity: 'Swap WETH to ETH',
  });

  await networkController.addPopularNetwork('Avalanche Network C-Chain');
  await walletPage.selectSwapAction();
  await swapPage.fetchQuote({ to: 'USDC', qty: '.001' });
  await swapPage.waitForInsufficentBalance();
  await swapPage.gotBack();

  await networkController.selectNetwork('Tenderly');
  await walletPage.selectSwapAction();
  await swapPage.fetchQuote({ from: 'DAI', to: 'USDC', qty: '1' });
  await swapPage.swap();
  await swapPage.waitForTransactionToComplete();
  await walletPage.selectActivityList();
  await activityListPage.checkActivityIsConfirmed({
    activity: 'Swap DAI to USDC',
  });
});
