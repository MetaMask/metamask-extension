import { Mockttp } from 'mockttp';
import { USER_STORAGE_FEATURE_NAMES } from '@metamask/profile-sync-controller/sdk';
import { withFixtures } from '../../../helpers';
import FixtureBuilder from '../../../fixture-builder';
import { mockIdentityServices } from '../mocks';
import { UserStorageMockttpController } from '../../../helpers/identity/user-storage/userStorageMockttpController';
import { completeOnboardFlowContactSyncing } from '../flows';
import { arrangeContactSyncingTestUtils } from './helpers';
import { MOCK_CONTACTS, createContactKey } from './mock-data';
import { IDENTITY_TEAM_SEED_PHRASE } from '../constants';

describe('Contact syncing - Modify Contact', function () {
  this.timeout(160000); // This test is very long, so we need an unusually high timeout

  const arrange = async () => {
    const testContacts = [
      MOCK_CONTACTS.ALICE_MAINNET,
      MOCK_CONTACTS.BOB_SEPOLIA,
    ];

    const mockedContactSyncResponse = testContacts.map(contact => ({
      HashedKey: createContactKey(contact),
      Data: JSON.stringify(contact),
    }));

    const userStorageMockttpController = new UserStorageMockttpController();

    return {
      testContacts,
      mockedContactSyncResponse,
      userStorageMockttpController,
    };
  };

  describe('from inside MetaMask', function () {
    it('syncs contact name changes across devices', async function () {
      const {
        testContacts,
        mockedContactSyncResponse,
        userStorageMockttpController,
      } = await arrange();

      const originalContact = testContacts[0]; // Alice
      const newContactName = 'Alice Smith Updated';

      // First device: Import wallet and modify contact name
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
          await completeOnboardFlowContactSyncing(driver, IDENTITY_TEAM_SEED_PHRASE);

          const { waitUntilSyncedContactsNumberEquals, getCurrentContacts } =
            arrangeContactSyncingTestUtils(driver, userStorageMockttpController);

          // Wait for existing contacts to sync
          await waitUntilSyncedContactsNumberEquals(testContacts.length);

          // Verify original contact exists
          let contacts = await getCurrentContacts();
          const originalContactLocal = contacts.find((contact: any) =>
            contact.address?.toLowerCase() === originalContact.a.toLowerCase() &&
            contact.chainId === originalContact.c
          );
          expect(originalContactLocal).toBeDefined();
          expect((originalContactLocal as any).name).toBe(originalContact.n);

          // Modify contact name via direct state manipulation
          await driver.executeScript((contactData) => {
            const { address, chainId, newName, memo } = contactData;
            if ((window as any).chrome?.extension?.getBackgroundPage) {
              const bg = (window as any).chrome.extension.getBackgroundPage();
              if (bg?.metamaskController?.addressBookController) {
                // Update the contact with new name
                bg.metamaskController.addressBookController.set(
                  address,
                  newName,
                  chainId,
                  memo
                );
              }
            }
          }, {
            address: originalContact.a,
            chainId: originalContact.c,
            newName: newContactName,
            memo: originalContact.m,
          });

          // Wait for sync to complete (contact count stays the same but data changes)
          await driver.wait(async () => {
            const updatedContacts = await getCurrentContacts();
            const updatedContact = updatedContacts.find((contact: any) =>
              contact.address?.toLowerCase() === originalContact.a.toLowerCase() &&
              contact.chainId === originalContact.c
            );
            return updatedContact && (updatedContact as any).name === newContactName;
          }, 15000);

          // Verify contact was updated
          contacts = await getCurrentContacts();
          const updatedContact = contacts.find((contact: any) =>
            contact.address?.toLowerCase() === originalContact.a.toLowerCase() &&
            contact.chainId === originalContact.c
          );
          expect((updatedContact as any).name).toBe(newContactName);

          console.log('Contact name updated and synced on first device');
        },
      );

      // Second device: Import same wallet and verify contact name change
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
          await completeOnboardFlowContactSyncing(driver, IDENTITY_TEAM_SEED_PHRASE);

          const { waitUntilSyncedContactsNumberEquals, getCurrentContacts } =
            arrangeContactSyncingTestUtils(driver, userStorageMockttpController);

          // Wait for all contacts to sync
          await waitUntilSyncedContactsNumberEquals(testContacts.length);

          // Verify contact has updated name
          const contacts = await getCurrentContacts();
          const syncedContact = contacts.find((contact: any) =>
            contact.address?.toLowerCase() === originalContact.a.toLowerCase() &&
            contact.chainId === originalContact.c
          );

          expect(syncedContact).toBeDefined();
          expect((syncedContact as any).name).toBe(newContactName);
          expect((syncedContact as any).memo).toBe(originalContact.m);

          console.log('Contact name change synced to second device');
        },
      );
    });

    it('syncs contact memo changes', async function () {
      const {
        testContacts,
        mockedContactSyncResponse,
        userStorageMockttpController,
      } = await arrange();

      const targetContact = testContacts[1]; // Bob
      const newMemo = 'Updated memo for testing';

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
          await completeOnboardFlowContactSyncing(driver, IDENTITY_TEAM_SEED_PHRASE);

          const { waitUntilSyncedContactsNumberEquals, getCurrentContacts } =
            arrangeContactSyncingTestUtils(driver, userStorageMockttpController);

          // Wait for existing contacts to sync
          await waitUntilSyncedContactsNumberEquals(testContacts.length);

          // Modify contact memo
          await driver.executeScript((contactData) => {
            const { address, chainId, name, newMemo } = contactData;
            if ((window as any).chrome?.extension?.getBackgroundPage) {
              const bg = (window as any).chrome.extension.getBackgroundPage();
              if (bg?.metamaskController?.addressBookController) {
                bg.metamaskController.addressBookController.set(
                  address,
                  name,
                  chainId,
                  newMemo
                );
              }
            }
          }, {
            address: targetContact.a,
            chainId: targetContact.c,
            name: targetContact.n,
            newMemo: newMemo,
          });

          // Wait for memo change to sync
          await driver.wait(async () => {
            const updatedContacts = await getCurrentContacts();
            const updatedContact = updatedContacts.find((contact: any) =>
              contact.address?.toLowerCase() === targetContact.a.toLowerCase() &&
              contact.chainId === targetContact.c
            );
            return updatedContact && (updatedContact as any).memo === newMemo;
          }, 15000);

          // Verify memo was updated
          const contacts = await getCurrentContacts();
          const updatedContact = contacts.find((contact: any) =>
            contact.address?.toLowerCase() === targetContact.a.toLowerCase() &&
            contact.chainId === targetContact.c
          );

          expect((updatedContact as any).name).toBe(targetContact.n);
          expect((updatedContact as any).memo).toBe(newMemo);

          console.log('Contact memo updated successfully');
        },
      );
    });

    it('handles concurrent contact modifications with timestamp resolution', async function () {
      const {
        testContacts,
        mockedContactSyncResponse,
        userStorageMockttpController,
      } = await arrange();

      const targetContact = testContacts[0]; // Alice

      // Create older version for conflict testing
      const olderContactVersion = {
        ...targetContact,
        n: 'Alice Old Name',
        m: 'Old memo',
        lu: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      };

      const olderMockResponse = [
        {
          HashedKey: createContactKey(olderContactVersion),
          Data: JSON.stringify(olderContactVersion),
        },
        ...mockedContactSyncResponse.slice(1), // Keep other contacts as-is
      ];

      await withFixtures(
        {
          fixtures: new FixtureBuilder({ onboarding: true }).build(),
          title: this.test?.fullTitle(),
          testSpecificMock: (server: Mockttp) => {
            userStorageMockttpController.setupPath(
              USER_STORAGE_FEATURE_NAMES.addressBook,
              server,
              {
                getResponse: olderMockResponse,
              },
            );
            return mockIdentityServices(server, userStorageMockttpController);
          },
        },
        async ({ driver }) => {
          await completeOnboardFlowContactSyncing(driver, IDENTITY_TEAM_SEED_PHRASE);

          const { waitUntilSyncedContactsNumberEquals, getCurrentContacts } =
            arrangeContactSyncingTestUtils(driver, userStorageMockttpController);

          // Wait for existing contacts to sync
          await waitUntilSyncedContactsNumberEquals(testContacts.length);

          // Add a newer version of the same contact locally
          const newerContactName = 'Alice Newer Name';
          const newerMemo = 'Newer memo';

          await driver.executeScript((contactData) => {
            const { address, chainId, newName, newMemo } = contactData;
            if ((window as any).chrome?.extension?.getBackgroundPage) {
              const bg = (window as any).chrome.extension.getBackgroundPage();
              if (bg?.metamaskController?.addressBookController) {
                bg.metamaskController.addressBookController.set(
                  address,
                  newName,
                  chainId,
                  newMemo
                );
              }
            }
          }, {
            address: targetContact.a,
            chainId: targetContact.c,
            newName: newerContactName,
            newMemo: newerMemo,
          });

          // Wait for conflict resolution - newer local version should win
          await driver.wait(async () => {
            const contacts = await getCurrentContacts();
            const resolvedContact = contacts.find((contact: any) =>
              contact.address?.toLowerCase() === targetContact.a.toLowerCase() &&
              contact.chainId === targetContact.c
            );
            return resolvedContact && (resolvedContact as any).name === newerContactName;
          }, 15000);

          // Verify the newer version won the conflict
          const contacts = await getCurrentContacts();
          const resolvedContact = contacts.find((contact: any) =>
            contact.address?.toLowerCase() === targetContact.a.toLowerCase() &&
            contact.chainId === targetContact.c
          );

          expect((resolvedContact as any).name).toBe(newerContactName);
          expect((resolvedContact as any).memo).toBe(newerMemo);

          console.log('Contact conflict resolved with newer version winning');
        },
      );
    });

    it('preserves contact data integrity during modifications', async function () {
      const {
        testContacts,
        mockedContactSyncResponse,
        userStorageMockttpController,
      } = await arrange();

      const targetContact = testContacts[0]; // Alice

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
          await completeOnboardFlowContactSyncing(driver, IDENTITY_TEAM_SEED_PHRASE);

          const { waitUntilSyncedContactsNumberEquals, getCurrentContacts } =
            arrangeContactSyncingTestUtils(driver, userStorageMockttpController);

          // Wait for existing contacts to sync
          await waitUntilSyncedContactsNumberEquals(testContacts.length);

          // Get original contact data
          let contacts = await getCurrentContacts();
          const originalContact = contacts.find((contact: any) =>
            contact.address?.toLowerCase() === targetContact.a.toLowerCase() &&
            contact.chainId === targetContact.c
          );

          const originalAddress = (originalContact as any).address;
          const originalChainId = (originalContact as any).chainId;

          // Modify only the name, preserving address and chainId
          const newName = 'Alice Modified Name Only';

          await driver.executeScript((contactData) => {
            const { address, chainId, newName, memo } = contactData;
            if ((window as any).chrome?.extension?.getBackgroundPage) {
              const bg = (window as any).chrome.extension.getBackgroundPage();
              if (bg?.metamaskController?.addressBookController) {
                bg.metamaskController.addressBookController.set(
                  address,
                  newName,
                  chainId,
                  memo
                );
              }
            }
          }, {
            address: targetContact.a,
            chainId: targetContact.c,
            newName: newName,
            memo: targetContact.m,
          });

          // Wait for update to sync
          await driver.wait(async () => {
            const updatedContacts = await getCurrentContacts();
            const updatedContact = updatedContacts.find((contact: any) =>
              contact.address?.toLowerCase() === targetContact.a.toLowerCase() &&
              contact.chainId === targetContact.c
            );
            return updatedContact && (updatedContact as any).name === newName;
          }, 15000);

          // Verify data integrity - address and chainId unchanged, only name updated
          contacts = await getCurrentContacts();
          const modifiedContact = contacts.find((contact: any) =>
            contact.address?.toLowerCase() === targetContact.a.toLowerCase() &&
            contact.chainId === targetContact.c
          );

          expect((modifiedContact as any).name).toBe(newName);
          expect((modifiedContact as any).address).toBe(originalAddress);
          expect((modifiedContact as any).chainId).toBe(originalChainId);
          expect((modifiedContact as any).memo).toBe(targetContact.m);

          // Verify other contacts were not affected
          expect(contacts.length).toBe(testContacts.length);

          const otherContact = contacts.find((contact: any) =>
            contact.address?.toLowerCase() === testContacts[1].a.toLowerCase()
          );
          expect((otherContact as any).name).toBe(testContacts[1].n);

          console.log('Contact data integrity preserved during modification');
        },
      );
    });
  });
});