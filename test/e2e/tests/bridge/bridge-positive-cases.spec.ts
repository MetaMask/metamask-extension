import { Suite } from 'mocha';
import { unlockWallet, withFixtures } from '../../helpers';
import HomePage from '../../page-objects/pages/home/homepage';
import {
  switchToNetworkFlow,
  searchAndSwitchToNetworkFlow,
} from '../../page-objects/flows/network.flow';
import { DEFAULT_BRIDGE_FEATURE_FLAGS } from './constants';
import { bridgeTransaction, getBridgeFixtures } from './bridge-test-utils';

describe('Bridge tests', function (this: Suite) {
  this.timeout(160000); // This test is very long, so we need an unusually high timeout
  it('Execute multiple bridge transactions', async function () {
    await withFixtures(
      getBridgeFixtures(
        this.test?.fullTitle(),
        DEFAULT_BRIDGE_FEATURE_FLAGS,
        false,
      ),
      async ({ driver }) => {
        await unlockWallet(driver);
        const homePage = new HomePage(driver);
        await homePage.check_expectedBalanceIsDisplayed('24');

        await bridgeTransaction(
          driver,
          {
            amount: '25',
            tokenFrom: 'DAI',
            tokenTo: 'ETH',
            fromChain: 'Ethereum',
            toChain: 'Linea',
            unapproved: true,
          },
          2,
          '24.9',
        );

        const getHeapSize = async () =>
          (await driver.executeScript(
            'return window.performance.memory.usedJSHeapSize/1024/1024',
          )) as number;

        const heapSizeBefore = await getHeapSize();

        // Switch to Linea Mainnet to set it as the selected network
        // in the network-controller
        await switchToNetworkFlow(driver, 'Linea Mainnet');

        await bridgeTransaction(
          driver,
          {
            amount: '1',
            tokenFrom: 'ETH',
            tokenTo: 'USDC',
            fromChain: 'Ethereum',
            toChain: 'Arbitrum One',
          },
          3,
          '23.9',
        );

        await bridgeTransaction(
          driver,
          {
            amount: '1',
            tokenFrom: 'ETH',
            tokenTo: 'ETH',
            fromChain: 'Ethereum',
            toChain: 'Linea',
          },
          4,
          '22.9',
        );

        const heapSizeAfter1 = await getHeapSize();
        console.log('heapSizeBefore', heapSizeBefore);
        console.log('heapSizeAfter1', heapSizeAfter1);

        expect(heapSizeAfter1 - heapSizeBefore).toBeLessThanOrEqual(1000);

        // Switch to Arbitrum One to set it as the selected network
        // in the network-controller
        await searchAndSwitchToNetworkFlow(driver, 'Arbitrum One');

        await bridgeTransaction(
          driver,
          {
            amount: '10',
            tokenFrom: 'USDC',
            tokenTo: 'DAI',
            fromChain: 'Ethereum',
            toChain: 'Linea',
            unapproved: true,
          },
          6,
          '22.9',
        );

        const heapSizeAfter2 = await getHeapSize();
        console.log('heapSizeAfter2', heapSizeAfter2);
        expect(heapSizeAfter2 - heapSizeBefore).toBeLessThanOrEqual(1000);
      },
    );
  });
});
