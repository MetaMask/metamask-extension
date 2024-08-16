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
    name: 'Tenderly',
    url: 'https://rpc.tenderly.co/fork/eb5b1b8b-b19e-425e-8197-03b75d680576',
    chainID: '1',
    symbol: 'ETH',
  },
};
//url: 'https://rpc.tenderly.co/fork/cdbcd795-097d-4624-aa16-680374d89a43'

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
  await swapPage.waitForQuote()
  await swapPage.swap();
  await swapPage.waitForTransactionToComplete();
  await walletPage.selectActivityList();
  await activityListPage.checkActivityIsConfirmed({
    activity: 'Swap ETH to DAI',
  });

  await networkController.addPopularNetwork({ networkName: 'Arbitrum One' });
  await walletPage.selectSwapAction();
  await swapPage.enterQuote({ to: 'MATIC', qty: '.001' });
  await swapPage.waitForInsufficentBalance();
  await swapPage.gotBack();

  await networkController.selectNetwork({ networkName: 'Tenderly' });
  await activityListPage.checkActivityIsConfirmed({
    activity: 'Swap ETH to DAI',
  });
  await walletPage.selectTokenWallet();
  //await walletPage.importTokens();

  await walletPage.selectSwapAction();
  await swapPage.enterQuote({ from: 'ETH', to: 'WETH', qty: '.001' });
  await swapPage.waitForQuote()
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
  await swapPage.waitForQuote()
  await swapPage.swap();
  await swapPage.waitForTransactionToComplete();
  await walletPage.selectActivityList();
  await activityListPage.checkActivityIsConfirmed({
    activity: 'Swap ETH to WETH',
  });

  await networkController.addPopularNetwork({
    networkName: 'Avalanche Network C-Chain',
  });
  await walletPage.selectSwapAction();
  await swapPage.enterQuote({ to: 'BNB', qty: '.001' });
  await swapPage.waitForInsufficentBalance();

  await swapPage.gotBack();

  await networkController.selectNetwork({ networkName: 'Tenderly' });
  await activityListPage.checkActivityIsConfirmed({
    activity: 'Swap ETH to WETH',
  });
  await walletPage.selectTokenWallet();
  //await walletPage.importTokens();

  await walletPage.selectSwapAction();
  await swapPage.enterQuote({ from: 'DAI', to: 'USDC', qty: '.5' });
  await swapPage.waitForQuote()
  await swapPage.switchTokenOrder();
  await swapPage.waitForQuote()
  await swapPage.swap();
  await swapPage.waitForTransactionToComplete();
  await walletPage.selectActivityList();
  await activityListPage.checkActivityIsConfirmed({
    activity: 'Swap USDC to DAI',
  });
});
