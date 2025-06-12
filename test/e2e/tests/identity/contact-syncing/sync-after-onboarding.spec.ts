import { Mockttp } from 'mockttp';
import { USER_STORAGE_FEATURE_NAMES } from '@metamask/profile-sync-controller/sdk';
import { withFixtures } from '../../../helpers';
import FixtureBuilder from '../../../fixture-builder';
import { mockIdentityServices } from '../mocks';
import { IDENTITY_TEAM_SEED_PHRASE, IDENTITY_TEAM_STORAGE_KEY } from '../constants';
import { UserStorageMockttpController } from '../../../helpers/identity/user-storage/userStorageMockttpController';
import { completeOnboardFlowContactSyncing } from '../flows';
import { arrangeContactSyncingTestUtils } from './helpers';
import { MOCK_CONTACTS, createContactKey } from './mock-data';
import { createEncryptedResponse } from '../../../helpers/identity/user-storage/generateEncryptedData';
import { expect } from '@playwright/test';

describe('Contact syncing - Sync after onboarding', function (this: any) {
  this.timeout(120000);

  const arrange = async () => {
    const testContacts = [
      MOCK_CONTACTS.ALICE_MAINNET,
      MOCK_CONTACTS.BOB_SEPOLIA,
      MOCK_CONTACTS.CHARLIE_POLYGON,
    ];

    const mockedContactSyncResponse = await Promise.all(
      testContacts.map(contact =>
        createEncryptedResponse({
          data: contact,
          storageKey: IDENTITY_TEAM_STORAGE_KEY,
          path: `${USER_STORAGE_FEATURE_NAMES.addressBook}.${createContactKey(contact)}`,
        })
      )
    );

    const userStorageMockttpController = new UserStorageMockttpController();

    return {
      testContacts,
      mockedContactSyncResponse,
      userStorageMockttpController,
    };
  };

  describe('from inside MetaMask', function () {
    it('retrieves all previously synced contacts after onboarding', async function (this: any) {
      const {
        testContacts,
        mockedContactSyncResponse,
        userStorageMockttpController
      } = await arrange();

      await withFixtures(
        {
          fixtures: new FixtureBuilder({ onboarding: true }).build(),
          title: this.test?.fullTitle(),
          testSpecificMock: (server: Mockttp) => {
            userStorageMockttpController.setupPath(
              USER_STORAGE_FEATURE_NAMES.addressBook,
              server,
              {
                getResponse: mockedContactSyncResponse,
              },
            );
            return mockIdentityServices(server, userStorageMockttpController);
          },
        },
        async ({ driver }) => {
          // Complete onboarding with existing SRP
          await completeOnboardFlowContactSyncing(
            driver,
            IDENTITY_TEAM_SEED_PHRASE,
          );

          // Set up test utilities
          const {
            waitUntilSyncedContactsNumberEquals,
            getCurrentContacts
          } = arrangeContactSyncingTestUtils(driver, userStorageMockttpController);

          // Wait for all contacts to be synced
          await waitUntilSyncedContactsNumberEquals(testContacts.length);

          // Verify all contacts were retrieved
          const syncedContacts = await getCurrentContacts();
          expect(syncedContacts.length).toBe(testContacts.length);

          // Check that specific contacts exist with correct data
          const contactNames = syncedContacts.map((contact: any) => contact.name);
          const contactAddresses = syncedContacts.map((contact: any) => contact.address?.toLowerCase());

          expect(contactNames).toContain('Alice Smith');
          expect(contactNames).toContain('Bob Johnson');
          expect(contactNames).toContain('Charlie Brown');

          expect(contactAddresses).toContain(MOCK_CONTACTS.ALICE_MAINNET.a.toLowerCase());
          expect(contactAddresses).toContain(MOCK_CONTACTS.BOB_SEPOLIA.a.toLowerCase());
          expect(contactAddresses).toContain(MOCK_CONTACTS.CHARLIE_POLYGON.a.toLowerCase());

          // Verify chain-specific contacts
          const aliceContact = syncedContacts.find((contact: any) =>
            contact.name === 'Alice Smith'
          );
          const bobContact = syncedContacts.find((contact: any) =>
            contact.name === 'Bob Johnson'
          );
          const charlieContact = syncedContacts.find((contact: any) =>
            contact.name === 'Charlie Brown'
          );

          expect((aliceContact as any)?.chainId).toBe(MOCK_CONTACTS.ALICE_MAINNET.c);
          expect((bobContact as any)?.chainId).toBe(MOCK_CONTACTS.BOB_SEPOLIA.c);
          expect((charlieContact as any)?.chainId).toBe(MOCK_CONTACTS.CHARLIE_POLYGON.c);

          // Verify memos are preserved
          expect((aliceContact as any)?.memo).toBe('DeFi trading partner');
          expect((bobContact as any)?.memo).toBe('Test network contact');
          expect((charlieContact as any)?.memo).toBe('Polygon validator');

          console.log('Contact syncing after onboarding completed successfully');
          console.log('Synced contacts:', syncedContacts.map((c: any) => ({
            name: c.name,
            address: c.address,
            chainId: c.chainId,
            memo: c.memo,
          })));
        },
      );
    });
  });
});