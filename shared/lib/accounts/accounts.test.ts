import { JsonRpcRequest, SnapId } from '@metamask/snaps-sdk';
import {
  BtcScope,
  DiscoverAccountsRequest,
  SolScope,
} from '@metamask/keyring-api';
import {
  SnapKeyring,
  SnapKeyringInternalOptions,
} from '@metamask/eth-snap-keyring';
import { Messenger } from '@metamask/base-controller';
import { AccountsControllerActions } from '@metamask/accounts-controller';
import { SnapControllerActions } from '@metamask/snaps-controllers';
import { createMockInternalAccount } from '../../../test/jest/mocks';
import {
  getNextAvailableSnapAccountName,
  getUniqueAccountName,
  MultichainWalletSnapClient,
  SnapAccountNameOptions,
  CreateAccountSnapOptions,
} from './accounts';
import { SOLANA_WALLET_SNAP_ID } from './solana-wallet-snap';
import { BITCOIN_WALLET_SNAP_ID } from './bitcoin-wallet-snap';

const SOLANA_SCOPES = [SolScope.Mainnet, SolScope.Testnet, SolScope.Devnet];

describe('accounts', () => {
  describe('getUniqueAccountName', () => {
    it('returns the suggested name if not used', () => {
      const name = getUniqueAccountName(
        [
          createMockInternalAccount({ name: 'Account 1' }),
          createMockInternalAccount({ name: 'Account 2' }),
          createMockInternalAccount({ name: 'Account 3' }),
        ],
        'Account 4',
      );

      expect(name).toBe('Account 4');
    });

    it('computes a unique name in case of conflicts', () => {
      const name = getUniqueAccountName(
        [
          createMockInternalAccount({ name: 'Account 1' }),
          createMockInternalAccount({ name: 'Account 2' }),
          createMockInternalAccount({ name: 'Account 3' }),
        ],
        'Account 1',
      );

      expect(name).toBe('Account 1 2');
    });
  });

  describe('getNextAvailableSnapAccountName', () => {
    const index = 3;
    const getNextAvailableAccountName = async () => `Snap Account ${index}`;
    const get = async (snapId: SnapId, options?: SnapAccountNameOptions) =>
      await getNextAvailableSnapAccountName(
        getNextAvailableAccountName,
        snapId,
        options,
      );

    it('returns a valid Snap account for Solana', async () => {
      expect(await get(SOLANA_WALLET_SNAP_ID)).toStrictEqual(
        `Solana Account ${index}`,
      );
    });

    it('returns a valid Snap account for Bitcoin', async () => {
      expect(await get(BITCOIN_WALLET_SNAP_ID)).toStrictEqual(
        `Bitcoin Account ${index}`,
      );
      expect(
        await get(BITCOIN_WALLET_SNAP_ID, { chainId: BtcScope.Testnet }),
      ).toStrictEqual(`Bitcoin Testnet Account ${index}`);
    });

    it('returns the same account name if Snap ID is not supported', async () => {
      expect(await get('npm:not-known' as SnapId)).toStrictEqual(
        `Snap Account ${index}`,
      );
    });
  });

  describe('MultichainWalletSnapClient', () => {
    const mockSnapKeyringCreateAccount = jest.fn();
    const mockAccountsControllerGetNextAvailableAccountName = jest.fn();
    const mockSnapControllerHandleRequest = jest.fn();

    const getSnapKeyring = () => {
      return {
        createAccount: mockSnapKeyringCreateAccount,
      } as unknown as SnapKeyring;
    };

    const getRootMessenger = () => {
      return new Messenger<
        AccountsControllerActions | SnapControllerActions,
        never
      >();
    };

    const getMessenger = () => {
      const messenger = getRootMessenger();

      messenger.registerActionHandler(
        'AccountsController:getNextAvailableAccountName',
        mockAccountsControllerGetNextAvailableAccountName,
      );
      messenger.registerActionHandler(
        'SnapController:handleRequest',
        mockSnapControllerHandleRequest,
      );
      return messenger;
    };

    const getClient = (snapId: SnapId) => {
      return new MultichainWalletSnapClient(
        snapId,
        getSnapKeyring(),
        getMessenger(),
      );
    };

    const getSolanaClient = () => {
      return getClient(SOLANA_WALLET_SNAP_ID);
    };

    const getBitcoinClient = () => {
      return getClient(BITCOIN_WALLET_SNAP_ID);
    };

    beforeEach(() => {
      jest.resetAllMocks();
    });

    describe('createAccount', () => {
      it('forwards options and internal options to the Snap keyring', async () => {
        const client = getSolanaClient();

        mockSnapKeyringCreateAccount.mockResolvedValue({});

        const options: CreateAccountSnapOptions = {
          derivationPath: 'm/',
          accountNameSuggestion: 'My Main Solana Account',
        };
        const internalOptions: SnapKeyringInternalOptions = {
          displayConfirmation: false,
          displayAccountNameSuggestion: false,
          setSelectedAccount: false,
        };
        await client.createAccount(options, internalOptions);

        expect(mockSnapKeyringCreateAccount).toHaveBeenCalledWith(
          client.getSnapId(),
          options,
          internalOptions,
        );
      });

      it('auto-injects an account name if not provided', async () => {
        const client = getSolanaClient();

        // First, get the name that will be auto-injected.
        mockAccountsControllerGetNextAvailableAccountName.mockResolvedValue(
          `Account Name 2`,
        );
        const autoInjectedAccountNameSuggestion =
          await client.getNextAvailableAccountName(); // Will be named for Solana account index 2.

        const options: CreateAccountSnapOptions = {
          derivationPath: 'm/',
          // No explicit `accountNameSuggestion`.
        };
        const internalOptions: SnapKeyringInternalOptions = {
          displayConfirmation: false,
          displayAccountNameSuggestion: false,
          setSelectedAccount: false,
        };
        await client.createAccount(options, internalOptions);

        expect(mockSnapKeyringCreateAccount).toHaveBeenCalledWith(
          client.getSnapId(),
          {
            ...options,
            accountNameSuggestion: autoInjectedAccountNameSuggestion,
          },
          internalOptions,
        );
      });
    });

    describe('getNextAvailableAccountName', () => {
      it('gets the next account name for Solana accounts', async () => {
        const client = getSolanaClient();

        const index = '1';
        mockAccountsControllerGetNextAvailableAccountName.mockResolvedValue(
          `Account Name ${index}`,
        );

        const name = await client.getNextAvailableAccountName();
        expect(name).toStrictEqual(`Solana Account ${index}`);
      });

      it('gets the next account name for Bitcoin mainnet accounts', async () => {
        const client = getBitcoinClient();

        const index = '2';
        mockAccountsControllerGetNextAvailableAccountName.mockResolvedValue(
          `Account Name ${index}`,
        );

        const name = await client.getNextAvailableAccountName();
        expect(name).toStrictEqual(`Bitcoin Account ${index}`);
      });

      it('gets the next account name for Bitcoin testnet accounts', async () => {
        const client = getBitcoinClient();

        const index = '3';
        mockAccountsControllerGetNextAvailableAccountName.mockResolvedValue(
          `Account Name ${index}`,
        );

        const name = await client.getNextAvailableAccountName({
          chainId: BtcScope.Testnet,
        });
        expect(name).toStrictEqual(`Bitcoin Testnet Account ${index}`);
      });

      it('gets the next account name for Bitcoin signet accounts', async () => {
        const client = getBitcoinClient();

        const index = '3';
        mockAccountsControllerGetNextAvailableAccountName.mockResolvedValue(
          `Account Name ${index}`,
        );

        const name = await client.getNextAvailableAccountName({
          chainId: BtcScope.Signet,
        });
        expect(name).toStrictEqual(`Bitcoin Signet Account ${index}`);
      });
    });

    describe('discoverAccounts', () => {
      const entropySource = '01JSEF2XG608Z0DS2WQNDXS7N6';
      const getDiscoverAccountsSnapRequest = (groupIndex: number) => {
        return {
          handler: 'onKeyringRequest',
          origin: 'metamask',
          request: {
            id: expect.any(String),
            jsonrpc: '2.0',
            method: 'keyring_discoverAccounts',
            params: {
              entropySource,
              groupIndex,
              scopes: [SolScope.Mainnet],
            },
          },
          snapId: SOLANA_WALLET_SNAP_ID,
        };
      };

      it('calls the Snap to discover accounts', async () => {
        const client = getSolanaClient();

        mockAccountsControllerGetNextAvailableAccountName.mockResolvedValue(
          'Account Name 1',
        ); // Needed to create account.
        mockSnapKeyringCreateAccount.mockResolvedValue({});

        // We use the inner request from a Snap request and we assume we receive a proper `DiscoverAccountRequest`.
        mockSnapControllerHandleRequest.mockImplementation(
          async ({ request }: { request: JsonRpcRequest }) => {
            const { groupIndex } = (request as DiscoverAccountsRequest).params;

            if (groupIndex > 1) {
              return []; // No more to discover (we only discover index 0 and 1).
            }

            return [
              {
                type: 'bip44',
                scopes: SOLANA_SCOPES,
                derivationPath: `m/44'/501'/${groupIndex}'/0'`,
              },
            ];
          },
        );

        await client.discoverAccounts(entropySource, SolScope.Mainnet);
        expect(mockSnapControllerHandleRequest).toHaveBeenCalledTimes(3);
        expect(mockSnapControllerHandleRequest).toHaveBeenNthCalledWith(
          1,
          getDiscoverAccountsSnapRequest(0),
        );
        expect(mockSnapControllerHandleRequest).toHaveBeenNthCalledWith(
          2,
          getDiscoverAccountsSnapRequest(1),
        );
        expect(mockSnapControllerHandleRequest).toHaveBeenNthCalledWith(
          3,
          getDiscoverAccountsSnapRequest(2),
        ); // We stop the discovery at index 2.

        expect(mockSnapKeyringCreateAccount).toHaveBeenCalledTimes(2);
      });
    });
  });
});
