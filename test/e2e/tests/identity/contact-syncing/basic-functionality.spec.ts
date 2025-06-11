import { Mockttp } from 'mockttp';
import { USER_STORAGE_FEATURE_NAMES } from '@metamask/profile-sync-controller/sdk';
import { withFixtures } from '../../../helpers';
import FixtureBuilder from '../../../fixture-builder';
import { mockIdentityServices } from '../mocks';
import {
  UserStorageMockttpController,
} from '../../../helpers/identity/user-storage/userStorageMockttpController';
import { completeNewWalletFlowContactSyncing } from '../flows';
import { expect } from '@playwright/test';

describe('Contact syncing - Basic Functionality', function (this: any) {
  this.timeout(60000);

  it('should be enabled after wallet creation', async function (this: any) {
    const userStorageMockttpController = new UserStorageMockttpController();

    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        title: this.test?.fullTitle(),
        testSpecificMock: (server: Mockttp) => {
          userStorageMockttpController.setupPath(
            USER_STORAGE_FEATURE_NAMES.addressBook,
            server,
          );
          return mockIdentityServices(server, userStorageMockttpController);
        },
      },
      async ({ driver }) => {
        // Complete wallet creation
        await completeNewWalletFlowContactSyncing(driver);

        // Wait for contact syncing to be enabled
        await driver.wait(async () => {
          const uiState = await driver.executeScript(() =>
            (window as any).stateHooks?.getCleanAppState?.()
          );
          return uiState?.metamask?.isContactSyncingEnabled === true;
        }, 15000);

        // Verify contact syncing state
        const finalState = await driver.executeScript(() =>
          (window as any).stateHooks?.getCleanAppState?.()
        );

        console.log('Contact syncing state:', {
          isContactSyncingEnabled: finalState.metamask.isContactSyncingEnabled,
          isBackupAndSyncEnabled: finalState.metamask.isBackupAndSyncEnabled,
          isContactSyncingInProgress: finalState.metamask.isContactSyncingInProgress,
        });

        // Contact syncing should be enabled
        expect(finalState.metamask.isContactSyncingEnabled).toBe(true);
        expect(finalState.metamask.isBackupAndSyncEnabled).toBe(true);
      },
    );
  });

  it('should handle empty remote storage', async function (this: any) {
    const userStorageMockttpController = new UserStorageMockttpController();

    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        title: this.test?.fullTitle(),
        testSpecificMock: (server: Mockttp) => {
          // Setup with empty remote storage
          userStorageMockttpController.setupPath(
            USER_STORAGE_FEATURE_NAMES.addressBook,
            server,
            {
              getResponse: [], // Empty remote storage
            },
          );
          return mockIdentityServices(server, userStorageMockttpController);
        },
      },
      async ({ driver }) => {
        await completeNewWalletFlowContactSyncing(driver);

        // Wait for contact syncing initialization
        await driver.wait(async () => {
          const uiState = await driver.executeScript(() =>
            (window as any).stateHooks?.getCleanAppState?.()
          );
          return uiState?.metamask?.isContactSyncingEnabled === true;
        }, 15000);

        // Verify contact syncing completed successfully
        const finalState = await driver.executeScript(() =>
          (window as any).stateHooks?.getCleanAppState?.()
        );

        expect(finalState.metamask.isContactSyncingEnabled).toBe(true);
        console.log('Contact syncing initialized with empty remote storage');
      },
    );
  });

  it('should initialize contact syncing with remote data available', async function (this: any) {
    this.timeout(90000); // Increase timeout to 90 seconds for this test
    const userStorageMockttpController = new UserStorageMockttpController();

    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        title: this.test?.fullTitle(),
        testSpecificMock: (server: Mockttp) => {
          // Setup with a simple mock that returns a basic contact response
          userStorageMockttpController.setupPath(
            USER_STORAGE_FEATURE_NAMES.addressBook,
            server,
            {
              getResponse: [{
                HashedKey: 'test_contact_key',
                Data: JSON.stringify({
                  v: '1',
                  a: '0x1234567890123456789012345678901234567890',
                  c: '0x1',
                  n: 'Test Contact',
                  m: 'Remote contact',
                  lu: Math.floor(Date.now() / 1000),
                }),
              }],
            },
          );
          return mockIdentityServices(server, userStorageMockttpController);
        },
      },
      async ({ driver }) => {
        console.log('Starting onboarding with pre-populated remote contact data');
        await completeNewWalletFlowContactSyncing(driver);

        // Wait for contact syncing to initialize
        await driver.wait(async () => {
          const uiState = await driver.executeScript(() =>
            (window as any).stateHooks?.getCleanAppState?.()
          );
          return uiState?.metamask?.isContactSyncingEnabled === true;
        }, 15000);

        // Verify contact syncing state
        const finalState = await driver.executeScript(() =>
          (window as any).stateHooks?.getCleanAppState?.()
        );

        console.log('Contact syncing with remote data state:', {
          isContactSyncingEnabled: finalState.metamask.isContactSyncingEnabled,
          isBackupAndSyncEnabled: finalState.metamask.isBackupAndSyncEnabled,
          isContactSyncingInProgress: finalState.metamask.isContactSyncingInProgress,
        });

        // All flags should be properly set
        expect(finalState.metamask.isContactSyncingEnabled).toBe(true);
        expect(finalState.metamask.isBackupAndSyncEnabled).toBe(true);
      },
    );
  });
});