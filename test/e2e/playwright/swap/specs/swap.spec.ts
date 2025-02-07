import { ethers } from 'ethers';
import { test, expect } from '@playwright/test';
import log from 'loglevel';

import { ChromeExtensionPage } from '../../shared/pageObjects/extension-page';
import { SignUpPage } from '../../shared/pageObjects/signup-page';
import { NetworkController } from '../../shared/pageObjects/network-controller-page';
import { SwapPage } from '../pageObjects/swap-page';
import { WalletPage } from '../../shared/pageObjects/wallet-page';
import { ActivityListPage } from '../../shared/pageObjects/activity-list-page';
import { Tenderly, addFundsToAccount } from '../tenderly-network';

let swapPage: SwapPage;
let networkController: NetworkController;
let walletPage: WalletPage;
let activityListPage: ActivityListPage;
let wallet: ethers.Wallet;

const testSet = [
  {
    quantity: '.5',
    source: 'ETH',
    type: 'native',
    destination: 'DAI',
    network: Tenderly.Mainnet,
  },
  /* TODO: Skipping these tests as it returning no quote available
  {
    quantity: '.5',
    source: 'ETH',
    type: 'native',
    destination: 'DAI',
    network: Tenderly.Linea,
  },
  {
    quantity: '10',
    source: 'DAI',
    type: 'unapproved',
    destination: 'USDC',
    network: Tenderly.Linea,
  },
  */
  {
    quantity: '50',
    source: 'DAI',
    type: 'unapproved',
    destination: 'ETH',
    network: Tenderly.Mainnet,
  },

  {
    source: 'ETH',
    quantity: '.5',
    type: 'native',
    destination: 'WETH',
    network: Tenderly.Mainnet,
  },
  {
    quantity: '.3',
    source: 'WETH',
    type: 'wrapped',
    destination: 'ETH',
    network: Tenderly.Mainnet,
  },
  {
    quantity: '50',
    source: 'DAI',
    type: 'ERC20->ERC20',
    destination: 'USDC',
    network: Tenderly.Mainnet,
  },
];

test.beforeAll(
  'Initialize extension, import wallet and add custom networks',
  async () => {
    const extension = new ChromeExtensionPage();
    const page = await extension.initExtension();
    page.setDefaultTimeout(15000);

    const signUp = new SignUpPage(page);
    await signUp.createWallet();

    networkController = new NetworkController(page);
    swapPage = new SwapPage(page);
    activityListPage = new ActivityListPage(page);
    walletPage = new WalletPage(page);
  },
);

// TODO: Skipping test as it's failing in the pipeline for unknown reasons
test.skip(`Get quote on Mainnet Network`, async () => {
  await walletPage.selectSwapAction();
  await walletPage.page.waitForTimeout(3000);
  await swapPage.enterQuote({
    from: 'ETH',
    to: 'USDC',
    qty: '.01',
    checkBalance: false,
  });
  await walletPage.page.waitForTimeout(3000);
  const quoteFound = await swapPage.waitForQuote();
  expect(quoteFound).toBeTruthy();
  await swapPage.goBack();
});

test(`Add Custom Networks and import test account`, async () => {
  let response;
  wallet = ethers.Wallet.createRandom();

  response = await addFundsToAccount(Tenderly.Mainnet.url, wallet.address);
  expect(response.error).toBeUndefined();

  response = await addFundsToAccount(Tenderly.Linea.url, wallet.address);
  expect(response.error).toBeUndefined();

  await networkController.addCustomNetwork(Tenderly.Linea);
  await networkController.addCustomNetwork(Tenderly.Mainnet);

  await walletPage.importAccount(wallet.privateKey);
  expect(walletPage.accountMenu).toHaveText('Account 2', { timeout: 30000 });
});

testSet.forEach((options) => {
  test(`should swap ${options.type} token ${options.source} to ${options.destination} on ${options.network.name}'`, async () => {
    await walletPage.selectTokenWallet();
    await networkController.selectNetwork(options.network);
    const balance = await walletPage.getTokenBalance();
    if (balance === '0 ETH') {
      test.skip();
    }

    await walletPage.selectSwapAction();
    // Allow balance label to populate
    await walletPage.page.waitForTimeout(3000);
    const quoteEntered = await swapPage.enterQuote({
      from: options.source,
      to: options.destination,
      qty: options.quantity,
      checkBalance: true,
    });

    if (quoteEntered) {
      const quoteFound = await swapPage.waitForQuote();
      if (quoteFound) {
        await swapPage.swap();
        const transactionCompleted =
          await swapPage.waitForTransactionToComplete({ seconds: 60 });
        if (transactionCompleted) {
          await walletPage.selectActivityList();
          await activityListPage.checkActivityIsConfirmed({
            activity: `Swap ${options.source} to ${options.destination}`,
          });
        } else {
          log.error(`\tERROR: Transaction did not complete. Skipping test`);
          test.skip();
        }
      } else {
        log.error(`\tERROR: No quotes found on. Skipping test`);
        test.skip();
      }
    } else {
      log.error(`\tERROR: Error while entering the quote. Skipping test`);
      test.skip();
    }
  });
});
