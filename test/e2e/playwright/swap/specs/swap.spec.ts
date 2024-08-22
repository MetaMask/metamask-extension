import { test } from '@playwright/test';

import { ChromeExtensionPage } from '../../shared/pageObjects/extension-page';
import { SignUpPage } from '../../shared/pageObjects/signup-page';
import { NetworkController } from '../../shared/pageObjects/network-controller-page';
import { SwapPage } from '../pageObjects/swap-page';
import { WalletPage } from '../../shared/pageObjects/wallet-page';
import { ActivityListPage } from '../../shared/pageObjects/activity-list-page';

let swapPage: SwapPage;
let networkController: NetworkController;
let walletPage: WalletPage;
let activityListPage: ActivityListPage;

const Tenderly = {
  Mainnet: {
    name: 'Tenderly - Mainnet',
    url: 'https://virtual.mainnet.rpc.tenderly.co/e63e2a2e-a04c-4f32-8379-c1fca19e82b6',
    chainID: '1',
    symbol: 'ETH',
  },
  Arbitrum: {
    name: 'Tenderly - Arbitrum',
    url: 'https://virtual.arbitrum.rpc.tenderly.co/70c7bde4-54e7-46a6-9053-9c3c539dcecf',
    chainID: '42161',
    symbol: 'ETH',
  },
  Avalanche: {
    name: 'Tenderly - Avalanche',
    url: 'https://virtual.avalanche.rpc.tenderly.co/ff17f1b4-f8ef-456e-be68-07481bc853ec',
    chainID: '43114',
    symbol: 'AVAX',
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

    await networkController.addCustomNetwork(Tenderly.Mainnet);
    walletPage = new WalletPage(page);
    await page.waitForTimeout(2000);
  },
);

test('Swap ETH to DAI - Switch to Arbitrum and fetch quote - Switch ETH - WETH', async () => {
  await walletPage.importTokens();

  await walletPage.selectSwapAction();
  await swapPage.enterQuote({ from: 'ETH', to: 'DAI', qty: '.001' });
  await swapPage.waitForQuote();
  await swapPage.swap();
  await swapPage.waitForTransactionToComplete();
  await walletPage.selectActivityList();
  await activityListPage.checkActivityIsConfirmed({
    activity: 'Swap ETH to DAI',
  });

  await networkController.addCustomNetwork(Tenderly.Arbitrum);
  await walletPage.selectTokenWallet();
  await walletPage.selectSwapAction();
  await swapPage.enterQuote({ from: 'ETH', to: 'MATIC', qty: '.001' });
  await swapPage.waitForQuote();
  await swapPage.swap();
  await swapPage.waitForTransactionToComplete();
  await walletPage.selectActivityList();
  await activityListPage.checkActivityIsConfirmed({
    activity: 'Swap ETH to MATIC',
  });

  await networkController.selectNetwork({ networkName: 'Tenderly - Mainnet' });
  await walletPage.selectTokenWallet();
  await walletPage.selectSwapAction();
  await swapPage.enterQuote({ from: 'ETH', to: 'WETH', qty: '.001' });
  await swapPage.waitForQuote();
  await swapPage.swap();
  await swapPage.waitForTransactionToComplete();
  await walletPage.selectActivityList();
  await activityListPage.checkActivityIsConfirmed({
    activity: 'Swap ETH to WETH',
  });
});

test('Swap WETH to ETH - Switch to Avalanche and fetch quote - Switch DAI - USDC', async () => {
  await walletPage.importTokens();

  await walletPage.selectSwapAction();
  await swapPage.enterQuote({ from: 'ETH', to: 'WETH', qty: '.001' });
  await swapPage.waitForQuote();
  await swapPage.swap();
  await swapPage.waitForTransactionToComplete();
  await walletPage.selectActivityList();
  await activityListPage.checkActivityIsConfirmed({
    activity: 'Swap ETH to WETH',
  });

  await networkController.addCustomNetwork(Tenderly.Avalanche);
  await walletPage.selectTokenWallet();
  await walletPage.selectSwapAction();
  await swapPage.enterQuote({ from: 'AVAX', to: 'BNB', qty: '.001' });
  await swapPage.waitForQuote();
  await swapPage.swap();
  await swapPage.waitForTransactionToComplete();
  await walletPage.selectActivityList();
  await activityListPage.checkActivityIsConfirmed({
    activity: 'Swap AVAX to BNB',
  });

  await networkController.selectNetwork({ networkName: 'Tenderly - Mainnet' });
  await walletPage.selectTokenWallet();
  await walletPage.selectSwapAction();
  await swapPage.enterQuote({ from: 'DAI', to: 'USDC', qty: '.5' });
  await swapPage.waitForQuote();
  await swapPage.switchTokenOrder();
  await swapPage.waitForQuote();
  await swapPage.swap();
  await swapPage.waitForTransactionToComplete();
  await walletPage.selectActivityList();
  await activityListPage.checkActivityIsConfirmed({
    activity: 'Swap USDC to DAI',
  });
});
