import { Suite } from 'mocha';
import { Driver } from '../../../webdriver/driver';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../../helpers';
import ActivityTab from '../../../page-objects/pages/home/activity-tab';
import HomePage from '../../../page-objects/pages/home/homepage';
import { login } from '../../../page-objects/flows/login.flow';
import {
  selectAllNetworksFromNetworkSelect,
  switchToNetworkFromNetworkSelect,
} from '../../../page-objects/flows/network.flow';
import { buildSolanaTestSpecificMock } from '../../solana/common-solana';
import { mockEvmActivityApi } from '../utils/mock-evm-activity-api';

describe('Solana - Activity network filter', function (this: Suite) {
  it('hides EVM activity under the Solana-only filter and shows it under all networks', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        testSpecificMock: buildSolanaTestSpecificMock({
          mockGetTransactionSuccess: true,
          withCustomMocks: mockEvmActivityApi,
        }),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await switchToNetworkFromNetworkSelect(driver, 'Solana');
        await homePage.goToActivityList();
        const activityTab = new ActivityTab(driver);

        await activityTab.checkTransactionActivityByText('Sent SOL');
        await activityTab.checkTransactionActivityNotPresentByText('Sent ETH');

        await selectAllNetworksFromNetworkSelect(driver);
        await activityTab.checkTransactionActivityByText('Sent SOL');
        await activityTab.checkTransactionActivityByText('Sent ETH');
        await activityTab.checkTransactionAmount('-1 ETH');

        // Restore the Solana-only filter so the EVM send is hidden again.
        await switchToNetworkFromNetworkSelect(driver, 'Solana');
        await activityTab.checkTransactionActivityNotPresentByText('Sent ETH');
      },
    );
  });

  // TODO: Add the cases below once the Solana snap supports them (follow-up
  // filed against snap-solana-wallet):
  //
  // 1. Approve ('Approved spending cap') in list + details — the snap's
  //    mapper classifies transactions from token balance deltas only, and an
  //    SPL delegation creates no balance change, so approvals always render
  //    as 'Interaction'. The mapper needs to parse Approve/ApproveChecked
  //    instructions first.
  //
  // 2. Bridge ('Bridged SOL') and swap/bridge in + out amounts in the
  //    details pages — the payloads map correctly, but the snap has no
  //    periodic history sync (unlike Tron's 60s self-sync cronjob), so
  //    history-mock-driven sync is not deterministic enough for E2E. Needs a
  //    continuous-sync trigger first.
});
