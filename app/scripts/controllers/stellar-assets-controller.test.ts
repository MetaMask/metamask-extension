import type { CaipAssetType } from '@metamask/keyring-api';
import {
  KeyringRpcMethod,
  XlmAccountType,
  XlmScope,
} from '@metamask/keyring-api';
import { KeyringTypes } from '@metamask/keyring-controller';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import { MOCK_ANY_NAMESPACE, Messenger } from '@metamask/messenger';
import type {
  MessengerActions,
  MessengerEvents,
  MockAnyNamespace,
} from '@metamask/messenger';
import { HandlerType } from '@metamask/snaps-utils';

import {
  GET_ACCOUNT_ASSET_INFO_CLIENT_METHOD,
  StellarAssetsController,
  getNativeAssetInfoForAsset,
  getTrustlineAssetInfoForAsset,
  isStellarEnrichmentEligibleAssetId,
  type StellarAssetsControllerMessenger,
} from './stellar-assets-controller';

const STELLAR_CLASSIC_USDC =
  'stellar:pubnet/asset:USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN' as CaipAssetType;

const STELLAR_NATIVE = 'stellar:pubnet/slip44:148' as CaipAssetType;

const STELLAR_INELIGIBLE_ASSET =
  'stellar:pubnet/sep41:CBIJBDNZNF4X35BJ4FFZWCDBSCKOP5NB4PLG4SNENRMLAPYG4P5FM6VN' as CaipAssetType;

const mockStellarAccount: InternalAccount = {
  type: XlmAccountType.Account,
  id: 'stellar-account-uuid',
  address: 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  scopes: [XlmScope.Pubnet],
  options: {},
  methods: [],
  metadata: {
    name: 'Stellar Account',
    importTime: 1737022568097,
    keyring: {
      type: KeyringTypes.snap,
    },
    snap: {
      id: 'npm:@metamask/stellar-wallet-snap',
      name: 'Stellar',
      enabled: true,
    },
    lastSelected: 0,
  },
};

type RootAction = MessengerActions<StellarAssetsControllerMessenger>;
type RootEvent = MessengerEvents<StellarAssetsControllerMessenger>;
type RootMessenger = Messenger<MockAnyNamespace, RootAction, RootEvent>;

type SnapHandleRequestParams = {
  handler: string;
  request?: {
    method?: string;
    params?: { assets?: string[]; accountId?: string; scope?: string };
  };
};

function getRootMessenger(): RootMessenger {
  return new Messenger({ namespace: MOCK_ANY_NAMESPACE });
}

function getRestrictedMessenger(
  messenger: RootMessenger,
): StellarAssetsControllerMessenger {
  const controllerMessenger = new Messenger<
    'StellarAssetsController',
    RootAction,
    RootEvent,
    RootMessenger
  >({
    namespace: 'StellarAssetsController',
    parent: messenger,
  });

  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'AccountsController:listMultichainAccounts',
      'SnapController:handleRequest',
      'KeyringController:getState',
    ],
    events: [
      'AccountsController:accountAdded',
      'AccountsController:accountRemoved',
      'AccountsController:accountAssetListUpdated',
    ],
  });

  return controllerMessenger;
}

function isListAccountAssetsCall(params: SnapHandleRequestParams): boolean {
  return (
    params.handler === HandlerType.OnKeyringRequest &&
    params.request?.method === KeyringRpcMethod.ListAccountAssets
  );
}

function isGetAccountAssetInfoCall(params: SnapHandleRequestParams): boolean {
  return (
    params.handler === HandlerType.OnClientRequest &&
    params.request?.method === GET_ACCOUNT_ASSET_INFO_CLIENT_METHOD
  );
}

function buildEnrichmentForAssets(assetIds: string[]) {
  return Object.fromEntries(
    assetIds.map((assetId) => [
      assetId,
      assetId === STELLAR_NATIVE
        ? { baseReserve: '2.5' }
        : { limit: '100', authorized: true, sponsored: false },
    ]),
  );
}

async function waitForAllPromises(): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

type SetupOptions = {
  state?: Partial<StellarAssetsController['state']>;
  listMultichainAccounts?: InternalAccount[];
  isUnlocked?: boolean;
  isEnabled?: () => boolean;
  handleRequestImplementation?: (
    params: SnapHandleRequestParams,
  ) => Promise<unknown>;
};

function setupController({
  state,
  listMultichainAccounts = [mockStellarAccount],
  isUnlocked = true,
  isEnabled = () => true,
  handleRequestImplementation,
}: SetupOptions = {}) {
  const messenger = getRootMessenger();
  const controllerMessenger = getRestrictedMessenger(messenger);

  const mockSnapHandleRequest = jest.fn(
    handleRequestImplementation ?? (() => Promise.resolve({})),
  );
  const mockListMultichainAccounts = jest.fn();
  const mockKeyringGetState = jest.fn();

  messenger.registerActionHandler(
    'SnapController:handleRequest',
    mockSnapHandleRequest,
  );
  messenger.registerActionHandler(
    'AccountsController:listMultichainAccounts',
    mockListMultichainAccounts,
  );
  messenger.registerActionHandler(
    'KeyringController:getState',
    mockKeyringGetState,
  );

  mockListMultichainAccounts.mockReturnValue(listMultichainAccounts);
  mockKeyringGetState.mockReturnValue({ isUnlocked });

  const controller = new StellarAssetsController({
    messenger: controllerMessenger,
    state,
    isEnabled,
  });

  return {
    controller,
    messenger,
    mockSnapHandleRequest,
    mockListMultichainAccounts,
    mockKeyringGetState,
  };
}

describe('StellarAssetsController', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('initial load', () => {
    it('stores native and trustline enrichment separately', async () => {
      const { controller, mockSnapHandleRequest } = setupController({
        handleRequestImplementation: (params) => {
          if (isGetAccountAssetInfoCall(params)) {
            const assets = params.request?.params?.assets ?? [];
            return Promise.resolve(buildEnrichmentForAssets(assets));
          }
          if (isListAccountAssetsCall(params)) {
            return Promise.resolve([STELLAR_CLASSIC_USDC, STELLAR_NATIVE]);
          }
          return Promise.resolve({});
        },
      });

      await waitForAllPromises();

      expect(
        controller.state.accountAssets[mockStellarAccount.id][
          STELLAR_CLASSIC_USDC
        ],
      ).toStrictEqual({
        limit: '100',
        authorized: true,
        sponsored: false,
      });
      expect(
        controller.state.accountAssets[mockStellarAccount.id][STELLAR_NATIVE],
      ).toStrictEqual({ baseReserve: '2.5' });
      expect(mockSnapHandleRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          handler: HandlerType.OnClientRequest,
          request: expect.objectContaining({
            method: GET_ACCOUNT_ASSET_INFO_CLIENT_METHOD,
            params: expect.objectContaining({
              accountId: mockStellarAccount.id,
              scope: XlmScope.Pubnet,
              assets: [STELLAR_CLASSIC_USDC, STELLAR_NATIVE],
            }),
          }),
        }),
      );
    });

    it('only requests enrichment for eligible stellar assets', async () => {
      const { mockSnapHandleRequest } = setupController({
        handleRequestImplementation: (params) => {
          if (isGetAccountAssetInfoCall(params)) {
            const assets = params.request?.params?.assets ?? [];
            return Promise.resolve(buildEnrichmentForAssets(assets));
          }
          if (isListAccountAssetsCall(params)) {
            return Promise.resolve([
              STELLAR_CLASSIC_USDC,
              STELLAR_INELIGIBLE_ASSET,
            ]);
          }
          return Promise.resolve({});
        },
      });

      await waitForAllPromises();

      const enrichmentCall = mockSnapHandleRequest.mock.calls.find(([params]) =>
        isGetAccountAssetInfoCall(params),
      );

      expect(enrichmentCall?.[0].request?.params?.assets).toStrictEqual([
        STELLAR_CLASSIC_USDC,
      ]);
    });

    it('stores enrichment after the snap request resolves', async () => {
      let resolveAssetInfo: (value: unknown) => void = () => undefined;
      const assetInfoPromise = new Promise((resolve) => {
        resolveAssetInfo = resolve;
      });

      const { controller } = setupController({
        handleRequestImplementation: (params) => {
          if (isGetAccountAssetInfoCall(params)) {
            return assetInfoPromise;
          }
          if (isListAccountAssetsCall(params)) {
            return Promise.resolve([STELLAR_CLASSIC_USDC]);
          }
          return Promise.resolve({});
        },
      });

      await waitForAllPromises();

      expect(
        controller.state.accountAssets[mockStellarAccount.id]?.[
          STELLAR_CLASSIC_USDC
        ],
      ).toBeUndefined();

      resolveAssetInfo({
        [STELLAR_CLASSIC_USDC]: {
          limit: '0',
          authorized: false,
          sponsored: false,
        },
      });
      await waitForAllPromises();

      expect(
        controller.state.accountAssets[mockStellarAccount.id][
          STELLAR_CLASSIC_USDC
        ],
      ).toStrictEqual({
        limit: '0',
        authorized: false,
        sponsored: false,
      });
    });

    it('does not store enrichment when the snap returns no data', async () => {
      const { controller } = setupController({
        handleRequestImplementation: (params) => {
          if (isGetAccountAssetInfoCall(params)) {
            return Promise.resolve(undefined);
          }
          if (isListAccountAssetsCall(params)) {
            return Promise.resolve([STELLAR_CLASSIC_USDC]);
          }
          return Promise.resolve({});
        },
      });

      await waitForAllPromises();

      expect(
        controller.state.accountAssets[mockStellarAccount.id],
      ).toBeUndefined();
    });

    it('does not store enrichment when the snap request fails', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);

      const { controller } = setupController({
        handleRequestImplementation: (params) => {
          if (isGetAccountAssetInfoCall(params)) {
            return Promise.reject(new Error('snap failure'));
          }
          if (isListAccountAssetsCall(params)) {
            return Promise.resolve([STELLAR_CLASSIC_USDC]);
          }
          return Promise.resolve({});
        },
      });

      await waitForAllPromises();

      expect(
        controller.state.accountAssets[mockStellarAccount.id],
      ).toBeUndefined();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('does not fetch when the keyring is locked', async () => {
      const { mockSnapHandleRequest } = setupController({ isUnlocked: false });

      await waitForAllPromises();

      expect(mockSnapHandleRequest).not.toHaveBeenCalled();
    });

    it('does not fetch when Stellar is disabled via isEnabled', async () => {
      const { mockSnapHandleRequest } = setupController({
        isEnabled: () => false,
      });

      await waitForAllPromises();

      expect(mockSnapHandleRequest).not.toHaveBeenCalled();
    });
  });

  describe('AccountsController:accountAssetListUpdated', () => {
    it('fetches info for added assets and removes deleted assets', async () => {
      const { controller, messenger, mockSnapHandleRequest } = setupController({
        state: {
          accountAssets: {
            [mockStellarAccount.id]: {
              [STELLAR_NATIVE]: {
                baseReserve: '1',
              },
            },
          },
        },
        handleRequestImplementation: (params) => {
          if (isGetAccountAssetInfoCall(params)) {
            return Promise.resolve({
              [STELLAR_CLASSIC_USDC]: {
                limit: '0',
                authorized: true,
                sponsored: false,
              },
            });
          }
          if (isListAccountAssetsCall(params)) {
            return Promise.resolve([]);
          }
          return Promise.resolve({});
        },
      });

      await waitForAllPromises();
      mockSnapHandleRequest.mockClear();

      messenger.publish('AccountsController:accountAssetListUpdated', {
        assets: {
          [mockStellarAccount.id]: {
            added: [STELLAR_CLASSIC_USDC],
            removed: [STELLAR_NATIVE],
          },
        },
      });

      await waitForAllPromises();

      expect(
        controller.state.accountAssets[mockStellarAccount.id][STELLAR_NATIVE],
      ).toBeUndefined();
      expect(
        controller.state.accountAssets[mockStellarAccount.id][
          STELLAR_CLASSIC_USDC
        ],
      ).toStrictEqual({
        limit: '0',
        authorized: true,
        sponsored: false,
      });
      expect(mockSnapHandleRequest).toHaveBeenCalledTimes(1);
    });
  });

  describe('AccountsController:accountAdded', () => {
    it('loads asset info for a newly added Stellar account', async () => {
      const { controller, messenger } = setupController({
        listMultichainAccounts: [],
        handleRequestImplementation: (params) => {
          if (isGetAccountAssetInfoCall(params)) {
            return Promise.resolve({
              [STELLAR_CLASSIC_USDC]: {
                limit: '1000',
                authorized: true,
                sponsored: false,
              },
            });
          }
          if (isListAccountAssetsCall(params)) {
            return Promise.resolve([STELLAR_CLASSIC_USDC]);
          }
          return Promise.resolve({});
        },
      });

      await waitForAllPromises();

      messenger.publish('AccountsController:accountAdded', mockStellarAccount);
      await waitForAllPromises();

      expect(
        controller.state.accountAssets[mockStellarAccount.id][
          STELLAR_CLASSIC_USDC
        ],
      ).toStrictEqual({
        limit: '1000',
        authorized: true,
        sponsored: false,
      });
    });
  });

  describe('AccountsController:accountRemoved', () => {
    it('clears cached asset info for the removed account', () => {
      const { controller, messenger } = setupController({
        listMultichainAccounts: [],
        state: {
          accountAssets: {
            [mockStellarAccount.id]: {
              [STELLAR_CLASSIC_USDC]: {
                limit: '0',
                authorized: false,
                sponsored: false,
              },
            },
          },
        },
      });

      messenger.publish(
        'AccountsController:accountRemoved',
        mockStellarAccount.id,
      );

      expect(
        controller.state.accountAssets[mockStellarAccount.id],
      ).toBeUndefined();
    });
  });
});

describe('Stellar enrichment asset id helpers', () => {
  it('identifies supported pubnet native and classic asset ids', () => {
    expect(isStellarEnrichmentEligibleAssetId(STELLAR_NATIVE)).toBe(true);
    expect(isStellarEnrichmentEligibleAssetId(STELLAR_CLASSIC_USDC)).toBe(true);
    expect(isStellarEnrichmentEligibleAssetId(STELLAR_INELIGIBLE_ASSET)).toBe(
      false,
    );
    expect(
      isStellarEnrichmentEligibleAssetId('stellar:testnet/slip44:148'),
    ).toBe(false);
  });

  it('parses native and trustline enrichment by asset id', () => {
    expect(
      getNativeAssetInfoForAsset(STELLAR_NATIVE, { baseReserve: '2.5' }),
    ).toStrictEqual({ baseReserve: '2.5' });
    expect(
      getNativeAssetInfoForAsset(STELLAR_CLASSIC_USDC, { baseReserve: '2.5' }),
    ).toBeUndefined();
    expect(
      getTrustlineAssetInfoForAsset(STELLAR_CLASSIC_USDC, {
        limit: '1',
        authorized: true,
        sponsored: false,
      }),
    ).toStrictEqual({
      limit: '1',
      authorized: true,
      sponsored: false,
    });
    expect(
      getTrustlineAssetInfoForAsset(STELLAR_NATIVE, {
        limit: '1',
        authorized: true,
        sponsored: false,
      }),
    ).toBeUndefined();
  });
});
