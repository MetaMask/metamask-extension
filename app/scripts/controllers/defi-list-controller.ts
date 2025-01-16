import type {
  AccountsControllerGetAccountAction,
  AccountsControllerGetSelectedAccountAction,
  AccountsControllerSelectedEvmAccountChangeEvent,
} from '@metamask/accounts-controller';
import type {
  RestrictedControllerMessenger,
  ControllerGetStateAction,
  ControllerStateChangeEvent,
} from '@metamask/base-controller';
import { BaseController } from '@metamask/base-controller';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import type {
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerNetworkDidChangeEvent,
  NetworkControllerStateChangeEvent,
  NetworkState,
  Provider,
} from '@metamask/network-controller';
import type { Hex } from '@metamask/utils';
import { Mutex } from 'async-mutex';
import type { Patch } from 'immer';
import fetchWithCache from '../../../shared/lib/fetch-with-cache';
import {
  GroupedPositionsResponse,
  DefiPositionResponse,
} from '../../../shared/types/defi';

// type GroupedPositionsResponseFixed = GroupedPositionsResponse & {
//   aggregatedValues: {
//     [prop: string]: number;
//   };
// };

/**
 * @type DefiListControllerState
 *
 * Defi list controller state
 * @property accountPositions - Object containing positions by account
 */
export type DefiListControllerState = {
  accountPositions: { [key: string]: GroupedPositionsResponse[] | null };
};

const metadata = {
  accountPositions: {
    persist: true,
    anonymous: false,
  },
};

const controllerName = 'DefiListController';

export type DefiListControllerActions = DefiListControllerGetStateAction;
// | TokensControllerAddDetectedTokensAction;

export type DefiListControllerGetStateAction = ControllerGetStateAction<
  typeof controllerName,
  DefiListControllerState
>;

// export type TokensControllerAddDetectedTokensAction = {
//   type: `${typeof controllerName}:addDetectedTokens`;
//   handler: TokensController['addDetectedTokens'];
// };

/**
 * The external actions available to the {@link DefiListController}.
 */
export type AllowedActions =
  | NetworkControllerGetNetworkClientByIdAction
  | AccountsControllerGetAccountAction
  | AccountsControllerGetSelectedAccountAction;

export type DefiListControllerStateChangeEvent = ControllerStateChangeEvent<
  typeof controllerName,
  DefiListControllerState
>;

export type DefiListControllerEvents = DefiListControllerStateChangeEvent;

export type AllowedEvents =
  | NetworkControllerStateChangeEvent
  | NetworkControllerNetworkDidChangeEvent
  | AccountsControllerSelectedEvmAccountChangeEvent;

/**
 * The messenger of the {@link DefiListController}.
 */
export type DefiListControllerMessenger = RestrictedControllerMessenger<
  typeof controllerName,
  DefiListControllerActions | AllowedActions,
  DefiListControllerEvents | AllowedEvents,
  AllowedActions['type'],
  AllowedEvents['type']
>;

export const getDefaultDefiListState = (): DefiListControllerState => {
  return {
    accountPositions: {},
  };
};

/**
 * Controller that stores assets and exposes convenience methods
 */
export class DefiListController extends BaseController<
  typeof controllerName,
  DefiListControllerState,
  DefiListControllerMessenger
> {
  readonly #mutex = new Mutex();

  #chainId: Hex;

  #selectedAccountId: string;

  #provider: Provider;

  #abortController: AbortController;

  /**
   * Tokens controller options
   * @param options - Constructor options.
   * @param options.chainId - The chain ID of the current network.
   * @param options.provider - Network provider.
   * @param options.state - Initial state to set on this controller.
   * @param options.messenger - The controller messenger.
   */
  constructor({
    chainId: initialChainId,
    provider,
    state,
    messenger,
  }: {
    chainId: Hex;
    provider: Provider;
    state?: Partial<DefiListControllerState>;
    messenger: DefiListControllerMessenger;
  }) {
    super({
      name: controllerName,
      metadata,
      messenger,
      state: {
        ...getDefaultDefiListState(),
        ...state,
      },
    });

    this.#chainId = initialChainId;

    this.#provider = provider;

    this.#selectedAccountId = this.#getSelectedAccount().id;

    this.#abortController = new AbortController();

    // this.messagingSystem.registerActionHandler(
    //   `${controllerName}:addDetectedTokens` as const,
    //   this.addDetectedTokens.bind(this),
    // );

    this.messagingSystem.subscribe(
      'AccountsController:selectedEvmAccountChange',
      this.#onSelectedAccountChange.bind(this),
    );

    this.messagingSystem.subscribe(
      'NetworkController:networkDidChange',
      this.#onNetworkDidChange.bind(this),
    );

    this.messagingSystem.subscribe(
      'NetworkController:stateChange',
      this.#onNetworkStateChange.bind(this),
    );

    // this.messagingSystem.subscribe(
    //   'TokenListController:stateChange',
    //   ({ tokenList }) => {
    //     const { tokens } = this.state;
    //     if (tokens.length && !tokens[0].name) {
    //       this.#updateTokensAttribute(tokenList, 'name');
    //     }
    //   },
    // );
  }

  /**
   * Handles the event when the network changes.
   *
   * @param networkState - The changed network state.
   * @param networkState.selectedNetworkClientId - The ID of the currently
   * selected network client.
   */
  async #onNetworkDidChange({ selectedNetworkClientId }: NetworkState) {
    console.log('onNetworkDidChange', selectedNetworkClientId);
    const selectedAddress = this.#getSelectedAddress();
    if (selectedAddress) {
      await this.#updateAccountPositions(selectedAddress);
    }
  }

  /**
   * Handles the event when the network state changes.
   * @param _ - The network state.
   * @param patches - An array of patch operations performed on the network state.
   */
  async #onNetworkStateChange(_: NetworkState, patches: Patch[]) {
    console.log('onNetworkStateChange');
    const selectedAddress = this.#getSelectedAddress();
    if (selectedAddress) {
      await this.#updateAccountPositions(selectedAddress);
    }
  }

  /**
   * Handles the selected account change in the accounts controller.
   * @param selectedAccount - The new selected account
   */
  async #onSelectedAccountChange(selectedAccount: InternalAccount) {
    console.log('onSelectedAccountChange', selectedAccount);
    this.#selectedAccountId = selectedAccount.id;

    await this.#updateAccountPositions(selectedAccount.address);
  }

  #getSelectedAccount() {
    return this.messagingSystem.call('AccountsController:getSelectedAccount');
  }

  #getSelectedAddress() {
    // If the address is not defined (or empty), we fallback to the currently selected account's address
    const account = this.messagingSystem.call(
      'AccountsController:getAccount',
      this.#selectedAccountId,
    );
    return account?.address || '';
  }

  /**
   * Reset the controller state to the default state.
   */
  resetState() {
    this.update(() => {
      return getDefaultDefiListState();
    });
  }

  async #updateAccountPositions(accountAddress: string) {
    console.log('UPDATING STATE', { accountAddress });

    if (!accountAddress) {
      return;
    }

    this.update((state) => {
      state.accountPositions[accountAddress] = null;
    });

    // const accountPositions = await this.#getGroupedPositions(accountAddress);
    // TODO Remove this hack once we have proper accounts
    const accountPositions = await this.#getGroupedPositions(
      /[0-7]/.test(accountAddress.slice(-1).toLowerCase())
        ? '0x08e82c749fef839ff97e7d17de29b4fdd87b04d7'
        : '0xaa62cf7caaf0c7e50deaa9d5d0b907472f00b258',
    );

    console.log('UPDATED STATE', { accountPositions });

    this.update((state) => {
      state.accountPositions[accountAddress] = accountPositions;
    });
  }

  async #getGroupedPositions(accountAddress: string) {
    const positions = (await fetchWithCache({
      url: `https://defi-services.metamask-institutional.io/defi-data/positions/${accountAddress}`,
      functionName: '#getGroupedPositions',
    })) as DefiPositionResponse[]; // TODO: Response validation

    const groupedPositions = groupPositionsByProtocolAndChain(positions);

    return groupedPositions;
  }
}

/**
 * Groups positions reponse of API by protocol and chain, aggregating market values
 *
 * @param defiPositionsResponse Response from the defi positions API
 * @returns
 */
function groupPositionsByProtocolAndChain(
  defiPositionsResponse: DefiPositionResponse[],
): GroupedPositionsResponse[] {
  const groupedPositions: GroupedPositionsResponse[] = [];

  for (const position of defiPositionsResponse) {
    if (!position.success) {
      continue;
    }

    const group = groupedPositions.find(
      ({ protocolId, chainId }) =>
        protocolId === position.protocolId && chainId === position.chainId,
    );

    const positions = position.tokens.flatMap((token) => {
      const marketValue = extractMarketValue(token.tokens as Token[]);

      return {
        ...position,
        marketValue,
        tokens: [token],
      };
    });

    const marketValue = positions.reduce(
      (total, position) => total + position.marketValue,
      0,
    );

    if (group) {
      positions.forEach((newPosition) => {
        group.positions.push(newPosition);
        group.aggregatedValues[position.positionType] =
          (group.aggregatedValues[position.positionType] || 0) +
          newPosition.marketValue;
      });
    } else {
      groupedPositions.push({
        protocolId: position.protocolId,
        chainId: position.chainId,
        positions,
        aggregatedValues: {
          [position.positionType]: marketValue,
        },
      });
    }
  }

  return groupedPositions;
}

type Token = {
  balance: number;
  price?: number;
  tokens?: Token[];
};
function extractMarketValue(tokens: Token[]): number {
  if (!tokens) {
    return 0;
  }

  let marketValue = 0;
  for (const token of tokens) {
    marketValue +=
      token.tokens && token.tokens.length > 0
        ? extractMarketValue(token.tokens)
        : token.balance * (token.price || 0);
  }

  return marketValue;
}

export default DefiListController;
