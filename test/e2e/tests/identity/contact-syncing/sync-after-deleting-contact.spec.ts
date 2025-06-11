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

describe('Contact syncing - Delete Contact', function () {
  this.timeout(160000); // This test is very long, so we need an unusually high timeout

  const arrange = async () => {
    const testContacts = [
      MOCK_CONTACTS.ALICE_MAINNET,
      MOCK_CONTACTS.BOB_SEPOLIA,
      MOCK_CONTACTS.CHARLIE_POLYGON,
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
    it('syncs contact deletions across devices', async function () {
      const {
        testContacts,
        mockedContactSyncResponse,
        userStorageMockttpController,
      } = await arrange();

      const contactToDelete = testContacts[1]; // Bob Sepolia

      // First device: Import wallet and delete a contact
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

          // Wait for all contacts to sync initially
          await waitUntilSyncedContactsNumberEquals(testContacts.length);

          // Verify the contact exists before deletion
          let contacts = await getCurrentContacts();
          const contactBeforeDeletion = contacts.find((contact: any) =>
            contact.address?.toLowerCase() === contactToDelete.a.toLowerCase() &&
            contact.chainId === contactToDelete.c
          );
          expect(contactBeforeDeletion).toBeDefined();
          expect((contactBeforeDeletion as any).name).toBe(contactToDelete.n);

          // Delete the contact via direct state manipulation
          await driver.executeScript((deleteData) => {
            const { address, chainId } = deleteData;
            if ((window as any).chrome?.extension?.getBackgroundPage) {
              const bg = (window as any).chrome.extension.getBackgroundPage();
              if (bg?.metamaskController?.addressBookController) {
                bg.metamaskController.addressBookController.delete(
                  chainId,
                  address
                );
              }
            }
          }, {
            address: contactToDelete.a,
            chainId: contactToDelete.c,
          });

          // Wait for contact count to decrease
          await waitUntilSyncedContactsNumberEquals(testContacts.length - 1);

          // Verify contact was deleted
          contacts = await getCurrentContacts();
          const deletedContact = contacts.find((contact: any) =>
            contact.address?.toLowerCase() === contactToDelete.a.toLowerCase() &&
            contact.chainId === contactToDelete.c
          );
          expect(deletedContact).toBeUndefined();

          // Verify other contacts are still present
          const remainingContactNames = contacts.map((contact: any) => contact.name);
          expect(remainingContactNames).toContain('Alice Smith');
          expect(remainingContactNames).toContain('Charlie Brown');
          expect(remainingContactNames).not.toContain('Bob Johnson');

          console.log('Contact deleted and synced on first device');
        },
      );

      // Second device: Import same wallet and verify contact deletion
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

          // Wait for remaining contacts to sync (should be 2, not 3)
          await waitUntilSyncedContactsNumberEquals(testContacts.length - 1);

          // Verify the deleted contact is not present
          const contacts = await getCurrentContacts();
          expect(contacts.length).toBe(testContacts.length - 1);

          const deletedContact = contacts.find((contact: any) =>
            contact.address?.toLowerCase() === contactToDelete.a.toLowerCase() &&
            contact.chainId === contactToDelete.c
          );
          expect(deletedContact).toBeUndefined();

          // Verify remaining contacts are present
          const contactNames = contacts.map((contact: any) => contact.name);
          expect(contactNames).toContain('Alice Smith');
          expect(contactNames).toContain('Charlie Brown');
          expect(contactNames).not.toContain('Bob Johnson');

          console.log('Contact deletion synced to second device');
        },
      );
    });

    it('handles deletion of multiple contacts', async function () {
      const {
        testContacts,
        mockedContactSyncResponse,
        userStorageMockttpController,
      } = await arrange();

      const contactsToDelete = [testContacts[0], testContacts[2]]; // Alice and Charlie

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

          // Wait for all contacts to sync initially
          await waitUntilSyncedContactsNumberEquals(testContacts.length);

          // Delete first contact
          await driver.executeScript((deleteData) => {
            const { address, chainId } = deleteData;
            if ((window as any).chrome?.extension?.getBackgroundPage) {
              const bg = (window as any).chrome.extension.getBackgroundPage();
              if (bg?.metamaskController?.addressBookController) {
                bg.metamaskController.addressBookController.delete(
                  chainId,
                  address
                );
              }
            }
          }, {
            address: contactsToDelete[0].a,
            chainId: contactsToDelete[0].c,
          });

          // Wait for first deletion
          await waitUntilSyncedContactsNumberEquals(testContacts.length - 1);

          // Delete second contact
          await driver.executeScript((deleteData) => {
            const { address, chainId } = deleteData;
            if ((window as any).chrome?.extension?.getBackgroundPage) {
              const bg = (window as any).chrome.extension.getBackgroundPage();
              if (bg?.metamaskController?.addressBookController) {
                bg.metamaskController.addressBookController.delete(
                  chainId,
                  address
                );
              }
            }
          }, {
            address: contactsToDelete[1].a,
            chainId: contactsToDelete[1].c,
          });

          // Wait for second deletion
          await waitUntilSyncedContactsNumberEquals(testContacts.length - 2);

          // Verify only Bob remains
          const contacts = await getCurrentContacts();
          expect(contacts.length).toBe(1);

          const remainingContact = contacts[0] as any;
          expect(remainingContact.name).toBe('Bob Johnson');
          expect(remainingContact.address?.toLowerCase()).toBe(testContacts[1].a.toLowerCase());

          console.log('Multiple contacts deleted successfully');
        },
      );
    });

    it('handles deletion of non-existent contacts gracefully', async function () {
      const {
        testContacts,
        mockedContactSyncResponse,
        userStorageMockttpController,
      } = await arrange();

      const nonExistentAddress = '0x1234567890123456789012345678901234567890';
      const nonExistentChainId = '999';

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

          // Wait for all contacts to sync initially
          await waitUntilSyncedContactsNumberEquals(testContacts.length);

          // Attempt to delete non-existent contact
          await driver.executeScript((deleteData) => {
            const { address, chainId } = deleteData;
            try {
              if ((window as any).chrome?.extension?.getBackgroundPage) {
                const bg = (window as any).chrome.extension.getBackgroundPage();
                if (bg?.metamaskController?.addressBookController) {
                  bg.metamaskController.addressBookController.delete(
                    chainId,
                    address
                  );
                }
              }
            } catch (error) {
              console.log('Expected error deleting non-existent contact:', error);
            }
          }, {
            address: nonExistentAddress,
            chainId: nonExistentChainId,
          });

          // Wait a bit and verify all original contacts are still present
          await driver.delay(2000);

          const contacts = await getCurrentContacts();
          expect(contacts.length).toBe(testContacts.length);

          const contactNames = contacts.map((contact: any) => contact.name);
          expect(contactNames).toContain('Alice Smith');
          expect(contactNames).toContain('Bob Johnson');
          expect(contactNames).toContain('Charlie Brown');

          console.log('Non-existent contact deletion handled gracefully');
        },
      );
    });

    it('preserves contact data integrity after partial deletions', async function () {
      const {
        testContacts,
        mockedContactSyncResponse,
        userStorageMockttpController,
      } = await arrange();

      const contactToDelete = testContacts[1]; // Bob
      const contactToKeep = testContacts[0]; // Alice

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

          // Wait for all contacts to sync initially
          await waitUntilSyncedContactsNumberEquals(testContacts.length);

          // Get original contact data for preserved contact
          let contacts = await getCurrentContacts();
          const originalContact = contacts.find((contact: any) =>
            contact.address?.toLowerCase() === contactToKeep.a.toLowerCase() &&
            contact.chainId === contactToKeep.c
          );

          const originalName = (originalContact as any).name;
          const originalAddress = (originalContact as any).address;
          const originalChainId = (originalContact as any).chainId;
          const originalMemo = (originalContact as any).memo;

          // Delete one contact
          await driver.executeScript((deleteData) => {
            const { address, chainId } = deleteData;
            if ((window as any).chrome?.extension?.getBackgroundPage) {
              const bg = (window as any).chrome.extension.getBackgroundPage();
              if (bg?.metamaskController?.addressBookController) {
                bg.metamaskController.addressBookController.delete(
                  chainId,
                  address
                );
              }
            }
          }, {
            address: contactToDelete.a,
            chainId: contactToDelete.c,
          });

          // Wait for deletion to sync
          await waitUntilSyncedContactsNumberEquals(testContacts.length - 1);

          // Verify preserved contact maintains all its data
          contacts = await getCurrentContacts();
          const preservedContact = contacts.find((contact: any) =>
            contact.address?.toLowerCase() === contactToKeep.a.toLowerCase() &&
            contact.chainId === contactToKeep.c
          );

          expect(preservedContact).toBeDefined();
          expect((preservedContact as any).name).toBe(originalName);
          expect((preservedContact as any).address).toBe(originalAddress);
          expect((preservedContact as any).chainId).toBe(originalChainId);
          expect((preservedContact as any).memo).toBe(originalMemo);

          // Verify deleted contact is gone
          const deletedContact = contacts.find((contact: any) =>
            contact.address?.toLowerCase() === contactToDelete.a.toLowerCase() &&
            contact.chainId === contactToDelete.c
          );
          expect(deletedContact).toBeUndefined();

          console.log('Contact data integrity preserved after partial deletion');
        },
      );
    });

    it('handles cross-chain contact deletions correctly', async function () {
      const { userStorageMockttpController } = await arrange();

      // Create same address on different chains
      const baseAddress = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
      const mainnetContact = {
        v: '1',
        a: baseAddress,
        c: '1', // Mainnet
        n: 'Cross-chain Contact Mainnet',
        m: 'On Mainnet',
        lu: Math.floor(Date.now() / 1000),
      };
      const sepoliaContact = {
        v: '1',
        a: baseAddress,
        c: '11155111', // Sepolia
        n: 'Cross-chain Contact Sepolia',
        m: 'On Sepolia',
        lu: Math.floor(Date.now() / 1000),
      };

      const crossChainMockResponse = [
        {
          HashedKey: createContactKey(mainnetContact),
          Data: JSON.stringify(mainnetContact),
        },
        {
          HashedKey: createContactKey(sepoliaContact),
          Data: JSON.stringify(sepoliaContact),
        },
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
                getResponse: crossChainMockResponse,
              },
            );
            return mockIdentityServices(server, userStorageMockttpController);
          },
        },
        async ({ driver }) => {
          await completeOnboardFlowContactSyncing(driver, IDENTITY_TEAM_SEED_PHRASE);

          const { waitUntilSyncedContactsNumberEquals, getCurrentContacts } =
            arrangeContactSyncingTestUtils(driver, userStorageMockttpController);

          // Wait for both cross-chain contacts to sync
          await waitUntilSyncedContactsNumberEquals(2);

          // Delete only the Mainnet version
          await driver.executeScript((deleteData) => {
            const { address, chainId } = deleteData;
            if ((window as any).chrome?.extension?.getBackgroundPage) {
              const bg = (window as any).chrome.extension.getBackgroundPage();
              if (bg?.metamaskController?.addressBookController) {
                bg.metamaskController.addressBookController.delete(
                  chainId,
                  address
                );
              }
            }
          }, {
            address: baseAddress,
            chainId: '1', // Delete only Mainnet version
          });

          // Wait for deletion to sync
          await waitUntilSyncedContactsNumberEquals(1);

          // Verify only Sepolia version remains
          const contacts = await getCurrentContacts();
          expect(contacts.length).toBe(1);

          const remainingContact = contacts[0] as any;
          expect(remainingContact.address?.toLowerCase()).toBe(baseAddress.toLowerCase());
          expect(remainingContact.chainId).toBe('11155111'); // Sepolia
          expect(remainingContact.name).toBe('Cross-chain Contact Sepolia');

          console.log('Cross-chain contact deletion handled correctly');
        },
      );
    });
  });
});