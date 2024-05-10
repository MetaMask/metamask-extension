import type {
  ControllerStateChangeEvent,
  RestrictedControllerMessenger,
} from '@metamask/base-controller';
import { BaseController } from '@metamask/base-controller';
import { BUYABLE_TEST_CHAINS_MAP } from '../../../../shared/constants/network';

const controllerName = 'FaucetController';

const getDefaultState = () => ({
  faucetSources: {},
});

const stateMetadata = {
  faucetSources: { persist: false, anonymous: false },
};

export type SourceEntry = {
  label: string;
};

export type FaucetControllerState = {
  // Type > Value > Variation > Entry
  faucetSources: Record<string, SourceEntry>;
};


export type FaucetStateChange = ControllerStateChangeEvent<
  typeof controllerName,
  FaucetControllerState
>;

export type FaucetControllerMessenger = RestrictedControllerMessenger<
  typeof controllerName,
  never,
  never,
  never,
  never
>;

export type BUYABLE_TEST_CHAINS_IDS = keyof typeof BUYABLE_TEST_CHAINS_MAP;

/** The metadata for a faucet provider. */
export type FaucetProviderMetadata = {
  /**
   * IDs for each alternate source of faucets.
   * Keyed by the buyable test chains.
   */
  sourceIds: Record<BUYABLE_TEST_CHAINS_IDS, string[]>;

  /**
   * Friendly labels to describe each source of faucets.
   * Keyed by the source ID.
   */
  sourceLabels: Record<string, string>;
};

/** The request data to send test eth to given address. */
export type FaucetProviderRequest = {
  /** faucet source id to request test token */
  sourceId: string;
  chainId: BUYABLE_TEST_CHAINS_IDS;

  /** The address value to get test tokens sent to. */
  address: string;
};

export type FaucetProviderSourceResult = {
  /**
   * Trx hash of the transaction that sent test token to the address.
   */
  txHash?: string;

  /**
   * An error that occurred while getting test token from faucet.
   * Undefined if there was no error.
   */
  error?: unknown;
};

export type FaucetProvider = {
  /**
   * Returns metadata about the faucet provider.
   */
  getMetadata(): FaucetProviderMetadata;

  /**
   * Calls faucet API to get test token.
   *
   * @param request - The request data including the value to propose names for.
   */
  sendETH(request: FaucetProviderRequest): Promise<FaucetProviderSourceResult>;
};


export type FaucetControllerOptions = {
  messenger: FaucetControllerMessenger;
  providers: FaucetProvider[];
  state?: Partial<FaucetControllerState>;
};


/**
 * Controller for abstracting faucet providers.
 */
export class FaucetController extends BaseController<
  typeof controllerName,
  FaucetControllerState,
  FaucetControllerMessenger
> {
  #providers: FaucetProvider[];

  /**
   * Construct a Faucet controller.
   *
   * @param options - Controller options.
   * @param options.messenger - Restricted controller messenger for the faucet controller.
   * @param options.providers - Array of faucet provider instances to get test tokens.
   * @param options.state - Initial state to set on the controller.
   */
  constructor({
    messenger,
    providers,
    state,
  }: FaucetControllerOptions) {
    super({
      name: controllerName,
      metadata: stateMetadata,
      messenger,
      state: { ...getDefaultState(), ...state },
    });

    console.log('INIT FAUCET PROVIDERS', providers);

    this.#providers = providers;
  }
  async getProviderTestToken(
    request: FaucetProviderRequest,
  ): Promise<FaucetProviderSourceResult | undefined> {
    let responseError: unknown | undefined;
    let response: FaucetProviderSourceResult | undefined;

    console.log('FAUCET CONTROLLER, getProviderTestToken', request);

    const provider = this.#providers.find((provider) =>
      this.#getSourceIds(provider, request.chainId).includes(request.sourceId),
    );

    if (!provider) {
      const ProviderNotFoundError = new Error('Faucet provider not found');
      console.log(ProviderNotFoundError);
      return {
        error: ProviderNotFoundError,
      };
    }

    console.log('FAUCET PROVIDER', provider);

    try {
      response = await provider.sendETH(request);
      responseError = response.error;
    } catch (error) {
      responseError = error;
    }

    return { txHash: response?.txHash , error: responseError };
  }

  getAllSourceIds(chainId: BUYABLE_TEST_CHAINS_IDS): string[] {
    return (
      this.#providers
        .map((provider) => this.#getSourceIds(provider, chainId))
        .flat()
    );
  }

  #getSourceIds(provider: FaucetProvider, chainId: BUYABLE_TEST_CHAINS_IDS): string[] {
    return provider.getMetadata().sourceIds[chainId];
  }

}
