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

let networks = {
  Tenderly: {
    Mainnet: {
      name: 'Tenderly',
      url: 'https://rpc.tenderly.co/fork/cdbcd795-097d-4624-aa16-680374d89a43',
      chainID: '1',
      symbol: 'ETH',
    },
    Arbitrum: {
      name: 'Arbitrum',
      url: 'https://rpc.tenderly.co/fork/fbe32ca8-6038-4b8d-8671-8eb8a28790da',
      chainID: '42161',
      symbol: 'ETH',
    },
    Optimism: {
      name: 'Optimism',
      url: 'https://rpc.tenderly.co/fork/dc477dc7-d3ae-4a5b-9afd-f16476e39bec',
      chainID: '10',
      symbol: 'ETH',
    },
  },
};

test.beforeEach(
  'Initialize extension, import wallet and add custom networks',
  async () => {
    const extension = new ChromeExtensionPage();
    const page = await extension.initExtension();

    const signUp = new SignUpPage(page);
    await signUp.importWallet();

    networkController = new NetworkController(page);
    swapPage = new SwapPage(page);
    activityListPage = new ActivityListPage(page);

    await networkController.addCustomNetwork(networks.Tenderly.Arbitrum);
    await networkController.addCustomNetwork(networks.Tenderly.Optimism);
    await networkController.addCustomNetwork(networks.Tenderly.Mainnet);
    walletPage = new WalletPage(page);
    await walletPage.importTokens();
  },
);

test('Swap ETH to DAI - Switch to Arbitrum and fetch quote - Switch ETH - WETH', async () => {
  await walletPage.selectSwapAction();
  await swapPage.fetchQuote({ to: 'DAI', qty: '.001' });
  await swapPage.swap();
  await swapPage.waitForTransactionToComplete();
  await walletPage.selectActivityList();
  await activityListPage.checkActivityIsConfirmed({
    activity: 'Swap ETH to DAI',
  });

  await networkController.selectNetwork({ networkName: 'Arbitrum' });
  await walletPage.selectSwapAction();
  await swapPage.fetchQuote({ to: 'USDC', qty: '.001' });
  await swapPage.swap();
  await swapPage.waitForTransactionToComplete();
  await walletPage.selectActivityList();
  await activityListPage.checkActivityIsConfirmed({
    activity: 'Swap ETH to USDC',
  });

  await networkController.selectNetwork({ networkName: 'Tenderly' });
  await walletPage.selectSwapAction();
  await swapPage.fetchQuote({ to: 'WETH', qty: '.001' });
  await swapPage.swap();
  await swapPage.waitForTransactionToComplete();
  await walletPage.selectActivityList();
  await activityListPage.checkActivityIsConfirmed({
    activity: 'Swap ETH to WETH',
  });
});
/*
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

  await networkController.addPopularNetwork({
    networkName: 'Avalanche Network C-Chain',
  });
  await walletPage.selectSwapAction();
  await swapPage.fetchQuote({ to: 'USDC', qty: '.001' });
  await swapPage.waitForInsufficentBalance();
  await swapPage.gotBack();

  await networkController.selectNetwork({ networkName: 'Tenderly' });
  await walletPage.selectSwapAction();
  await swapPage.fetchQuote({ from: 'DAI', to: 'USDC', qty: '1' });
  await swapPage.swap();
  await swapPage.waitForTransactionToComplete();
  await walletPage.selectActivityList();
  await activityListPage.checkActivityIsConfirmed({
    activity: 'Swap DAI to USDC',
  });
});
*/
