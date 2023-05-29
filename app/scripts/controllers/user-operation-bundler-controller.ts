import {
  BaseControllerV2,
  RestrictedControllerMessenger,
} from '@metamask/base-controller';
import { Hex } from '@metamask/utils';
import { Log, TransactionReceipt } from '@ethersproject/providers';
import { UserOperation } from '../../../shared/constants/transaction';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { NetworkControllerState } from './network';

const controllerName = 'UserOperationBundlerController';

export type UserOperationBundlerControllerState = {
  currentBundlerConfig: BundlerConfiguration;
  bundlerStatus: BundlerStatus;
  bundlerConfigurations: BundlerConfigurations;
};

const stateMetadata = {
  currentBundlerConfig: { persist: true, anonymous: false },
  bundlerStatus: { persist: true, anonymous: false },
  bundlerConfigurations: { persist: true, anonymous: false },
};

enum BundlerStatus {
  Unknown = 'unknown',
  Available = 'available',
  Unavailable = 'unavailable',
}

const CHAIN_IDS_TO_CHAIN_NAMES_MAP = {
  [CHAIN_IDS.MAINNET]: 'mainnet',
  [CHAIN_IDS.GOERLI]: 'goerli',
  [CHAIN_IDS.ARBITRUM]: 'arbitrum',
  [CHAIN_IDS.OPTIMISM]: 'optimism',
  [CHAIN_IDS.OPTIMISM_TESTNET]: 'goerli_optimism',
  // [CHAIN_IDS.AVALANCHE]: 'avalanche',
  // [CHAIN_IDS.AVALANCHE_TESTNET]: 'fuji',
  [CHAIN_IDS.POLYGON]: 'polygon',
  [CHAIN_IDS.POLYGON_TESTNET]: 'mumbai',
  // [CHAIN_IDS.BSC]: 'bsc',
  // [CHAIN_IDS.BSC_TESTNET]: 'bsc_testnet',
  // [CHAIN_IDS.FANTOM]: 'fantom',
  // [CHAIN_IDS.FANTOM_TESTNET]: 'fantom_testnet',
  [CHAIN_IDS.LINEA_TESTNET]: 'linea',
};

type BundlerConfigurationId = string;

export type BundlerConfigurations = Record<
  BundlerConfigurationId,
  BundlerConfiguration
>;

export type BundlerConfiguration = {
  id: BundlerConfigurationId;
  chainId: Hex;
  rpcUrl: string;
  nickname?: string;
  entrypoint: Hex;
};

export enum UserOperationMethod {
  SendOperation = 'eth_sendUserOperation',
  EstimateGas = 'eth_estimateUserOperationGas',
  GetOperationByHash = 'eth_getUserOperationByHash',
  GetOperationReceipt = 'eth_getUserOperationReceipt',
  GetSupportedEntryPoints = 'eth_supportedEntryPoints',
  GetChainId = 'eth_chainId',
}

export type UserOperationPayload = [UserOperation] | [string] | [];

export type SendUserOperationOptions = {
  userOperation: UserOperation;
};

export type QueryUserOperationOptions = {
  userOperationHash: string;
};

export type GasEstimateUserOperationResult = {
  preVerificationGas: Hex;
  verificationGasLimit: Hex;
  callGasLimit: Hex;
};

export type QueryHashUserOperationResult =
  | ({
      entryPoint: Hex;
      blockNumber: Hex;
      blockHash: Hex;
      transactionHash: Hex;
    } & UserOperation)
  | null; // Null if transaction isn't included in a block;

export type QueryReceiptUserOperationResult = {
  userOpHash: Hex;
  entryPoint: Hex;
  sender: Hex;
  nonce: Hex;
  paymaster: Hex | null;
  actualGasCost: Hex;
  actualGasUsed: Hex;
  success: boolean;
  reason: string;
  logs: Log[];
  receipt: TransactionReceipt;
} | null; // Null if transaction isn't included in a block;

export type SendUserOperationResult = Hex; // User Operation hash

export declare type SendUserOperationRequest = {
  type: `${typeof controllerName}:sendUserOperation`;
  handler: (
    opts: SendUserOperationOptions,
  ) => ReturnType<UserOperationBundlerController['sendUserOperation']>;
};

export declare type QueryUserOperationRequest = {
  type: `${typeof controllerName}:QueryUserOperation`;
  handler: (
    opts: QueryUserOperationOptions,
  ) => ReturnType<UserOperationBundlerController['queryReceiptUserOperation']>;
};

export type UserOperationResult =
  | GasEstimateUserOperationResult
  | SendUserOperationResult
  | QueryHashUserOperationResult
  | QueryReceiptUserOperationResult;

export type UserOperationControllerStateChange = {
  type: `${typeof controllerName}:stateChange`;
  payload: [UserOperationBundlerControllerState];
};

export type UserOperationControllerEvents = UserOperationControllerStateChange;

export type UserOperationControllerActions =
  | SendUserOperationRequest
  | QueryUserOperationRequest;

export type UserOperationBundlerControllerMessenger =
  RestrictedControllerMessenger<
    typeof controllerName,
    UserOperationControllerActions,
    UserOperationControllerStateChange,
    UserOperationControllerActions['type'],
    never
  >;

export type UserOperationBundlerControllerOptions = {
  messenger: UserOperationBundlerControllerMessenger;
  bundlerProjectId: string;
  onNetworkStateChange: (
    listener: (state: NetworkControllerState) => void,
  ) => void;
};

function buildDefaultBundlerConfig(
  bundlerProjectId: string,
): BundlerConfiguration {
  return {
    id: 'default',
    chainId: '0x1',
    rpcUrl: `https://api.pimlico.io/v1/${CHAIN_IDS_TO_CHAIN_NAMES_MAP[CHAIN_IDS]}}/rpc?apikey=${bundlerProjectId}`,
    entrypoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
  };
}

function buildDefaultBundlerConfigurations(
  bundlerProjectId: string,
): BundlerConfigurations {
  return {
    [CHAIN_IDS.MAINNET]: {
      id: 'default_mainnet',
      chainId: CHAIN_IDS.MAINNET,
      rpcUrl: `https://api.pimlico.io/v1/${
        CHAIN_IDS_TO_CHAIN_NAMES_MAP[CHAIN_IDS.MAINNET]
      }}/rpc?apikey=${bundlerProjectId}`,
      entrypoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
    },
    [CHAIN_IDS.ARBITRUM]: {
      id: 'default_arbitrum',
      chainId: CHAIN_IDS.ARBITRUM,
      rpcUrl: `https://api.pimlico.io/v1/${
        CHAIN_IDS_TO_CHAIN_NAMES_MAP[CHAIN_IDS.ARBITRUM]
      }}/rpc?apikey=${bundlerProjectId}`,
      entrypoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
    },
    [CHAIN_IDS.OPTIMISM]: {
      id: 'default_optimism',
      chainId: CHAIN_IDS.OPTIMISM,
      rpcUrl: `https://api.pimlico.io/v1/${
        CHAIN_IDS_TO_CHAIN_NAMES_MAP[CHAIN_IDS.OPTIMISM]
      }}/rpc?apikey=${bundlerProjectId}`,
      entrypoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
    },
    // [CHAIN_IDS.AVALANCHE]: {
    //   id: 'default_avalance',
    //   chainId: CHAIN_IDS.AVALANCHE,
    //   rpcUrl: `https://api.pimlico.io/v1/${
    //     CHAIN_IDS_TO_CHAIN_NAMES_MAP[CHAIN_IDS.AVALANCHE]
    //   }}/rpc?apikey=${bundlerProjectId}`,
    //   entrypoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
    // },
    [CHAIN_IDS.POLYGON]: {
      id: 'default_polygon',
      chainId: CHAIN_IDS.POLYGON,
      rpcUrl: `https://api.pimlico.io/v1/${
        CHAIN_IDS_TO_CHAIN_NAMES_MAP[CHAIN_IDS.POLYGON]
      }}/rpc?apikey=${bundlerProjectId}`,
      entrypoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
    },
    // [CHAIN_IDS.BSC]: {
    //   id: 'default_bsc',
    //   chainId: CHAIN_IDS.BSC,
    //   rpcUrl: `https://api.pimlico.io/v1/${
    //     CHAIN_IDS_TO_CHAIN_NAMES_MAP[CHAIN_IDS.BSC]
    //   }}/rpc?apikey=${bundlerProjectId}`,
    //   entrypoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
    // },
    // [CHAIN_IDS.FANTOM]: {
    //   id: 'default_fantom',
    //   chainId: CHAIN_IDS.FANTOM,
    //   rpcUrl: 'https:/:/bundler.metamask.io',
    //   entrypoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
    // },

    // TESTNETS
    [CHAIN_IDS.LINEA_TESTNET]: {
      id: 'default_linea_testnet',
      chainId: CHAIN_IDS.LINEA_TESTNET,
      rpcUrl: `https://api.pimlico.io/v1/${
        CHAIN_IDS_TO_CHAIN_NAMES_MAP[CHAIN_IDS.LINEA_TESTNET]
      }}/rpc?apikey=${bundlerProjectId}`,
      entrypoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
    },
    [CHAIN_IDS.GOERLI]: {
      id: 'default_goerli',
      chainId: CHAIN_IDS.GOERLI,
      rpcUrl: `https://api.pimlico.io/v1/${
        CHAIN_IDS_TO_CHAIN_NAMES_MAP[CHAIN_IDS.GOERLI]
      }}/rpc?apikey=${bundlerProjectId}`,
      entrypoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
    },
    // [CHAIN_IDS.AVALANCHE_TESTNET]: {
    //   id: 'default_avalanche_testnet',
    //   chainId: CHAIN_IDS.AVALANCHE_TESTNET,
    //   rpcUrl: `https://api.pimlico.io/v1/${
    //     CHAIN_IDS_TO_CHAIN_NAMES_MAP[CHAIN_IDS.AVALANCHE_TESTNET]
    //   }}/rpc?apikey=${bundlerProjectId}`,
    //   entrypoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
    // },
    // [CHAIN_IDS.BSC_TESTNET]: {
    //   id: 'default_bsc_testnet',
    //   chainId: CHAIN_IDS.BSC_TESTNET,
    //   rpcUrl: `https://api.pimlico.io/v1/${
    //     CHAIN_IDS_TO_CHAIN_NAMES_MAP[CHAIN_IDS.BSC_TESTNET]
    //   }}/rpc?apikey=${bundlerProjectId}`,
    //   entrypoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
    // },
    [CHAIN_IDS.POLYGON_TESTNET]: {
      id: 'default_polygon_testnet',
      chainId: CHAIN_IDS.POLYGON_TESTNET,
      rpcUrl: `https://api.pimlico.io/v1/${
        CHAIN_IDS_TO_CHAIN_NAMES_MAP[CHAIN_IDS.POLYGON_TESTNET]
      }}/rpc?apikey=${bundlerProjectId}`,
      entrypoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
    },
    [CHAIN_IDS.OPTIMISM_TESTNET]: {
      id: 'default_optimism_testnet',
      chainId: CHAIN_IDS.OPTIMISM_TESTNET,
      rpcUrl: `https://api.pimlico.io/v1/${
        CHAIN_IDS_TO_CHAIN_NAMES_MAP[CHAIN_IDS.OPTIMISM_TESTNET]
      }}/rpc?apikey=${bundlerProjectId}`,
      entrypoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
    },
    // [CHAIN_IDS.FANTOM_TESTNET]: {
    //   id: 'default_fantom_testnet',
    //   chainId: CHAIN_IDS.FANTOM_TESTNET,
    //   rpcUrl: `https://api.pimlico.io/v1/${
    //     CHAIN_IDS_TO_CHAIN_NAMES_MAP[CHAIN_IDS.FANTOM_TESTNET]
    //   }}/rpc?apikey=${bundlerProjectId}`,
    //   entrypoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
    // },
  };
}

export const UserOperationBundlerErrorCodes = {
  '-32602': 'Invalid UserOperation struct/fields',
  '': '',
};

const getDefaultState = (bundlerProjectId: string) => ({
  currentBundlerConfig: buildDefaultBundlerConfig(bundlerProjectId),
  bundlerStatus: BundlerStatus.Available,
  bundlerConfigurations: buildDefaultBundlerConfigurations(bundlerProjectId),
});

export default class UserOperationBundlerController extends BaseControllerV2<
  typeof controllerName,
  UserOperationBundlerControllerState,
  UserOperationBundlerControllerMessenger
> {
  #messenger: UserOperationBundlerControllerMessenger;

  #bundlerProjectId: string;

  constructor({
    messenger,
    bundlerProjectId,
    onNetworkStateChange,
  }: UserOperationBundlerControllerOptions) {
    super({
      name: controllerName,
      metadata: stateMetadata,
      messenger,
      state: getDefaultState(bundlerProjectId),
    });

    this.#messenger = messenger;
    this.#bundlerProjectId = bundlerProjectId;

    onNetworkStateChange(async (networkControllerState) => {
      await this.#onNetworkControllerStateChange(networkControllerState);
    });
  }

  async #onNetworkControllerStateChange(
    networkControllerState: NetworkControllerState,
  ) {
    const newChainId = networkControllerState.providerConfig.chainId;

    // set current bundler
    this.#configureCurrentBundler({ chainId: newChainId });
    this.#messenger.publish(
      'UserOperationBundlerController:stateChange',
      this.state,
    );
  }

  async pingBundlerStatus(): Promise<boolean> {
    // TODO: implement
    return true;
  }

  #getBundlerUrl(chainId: Hex): string {
    const bundlerConfig = this.state.bundlerConfigurations[chainId];
    if (!bundlerConfig) {
      throw new Error(
        `[UserOperationBundler] Unknown bundler for chain ${chainId}`,
      );
    }
    return bundlerConfig.rpcUrl;
  }

  #configureCurrentBundler({ chainId }: { chainId: Hex }): void {
    const bundlerConfiguration = this.state.bundlerConfigurations[chainId];
    if (!bundlerConfiguration) {
      throw new Error(
        `[UserOperationBundlerController] No bundler configuration found for chainId ${chainId}`,
      );
    }
    this.update((state) => {
      state.currentBundlerConfig = bundlerConfiguration;
    });
  }

  async sendUserOperation(
    opts: SendUserOperationOptions,
  ): Promise<SendUserOperationResult> {
    const sendUserOperationResult = (await this.#bunderRequest(
      UserOperationMethod.SendOperation,
      [opts.userOperation],
    )) as SendUserOperationResult;
    return sendUserOperationResult;
  }

  async queryReceiptUserOperation(
    opts: QueryUserOperationOptions,
  ): Promise<QueryReceiptUserOperationResult> {
    const queryReceiptUserOperationResult = (await this.#bunderRequest(
      UserOperationMethod.GetOperationReceipt,
      [opts.userOperationHash],
    )) as QueryReceiptUserOperationResult;

    return queryReceiptUserOperationResult;
  }

  async estimateUserOperationGas(
    opts: SendUserOperationOptions,
  ): Promise<GasEstimateUserOperationResult> {
    const gasEstimate = (await this.#bunderRequest(
      UserOperationMethod.EstimateGas,
      [opts.userOperation],
    )) as GasEstimateUserOperationResult;

    return gasEstimate;
  }

  async #bunderRequest(
    userOperationMethod: UserOperationMethod,
    payload: UserOperationPayload = [],
  ): Promise<UserOperationResult> {
    if (this.state.bundlerStatus !== BundlerStatus.Available) {
      throw new Error('Bundler is not available');
    }

    const { rpcUrl, entrypoint } = this.state.currentBundlerConfig;

    let params;
    switch (userOperationMethod) {
      case UserOperationMethod.EstimateGas: {
        params = [payload];
        break;
      }
      case UserOperationMethod.GetChainId: {
        params = [];
        break;
      }
      case UserOperationMethod.GetOperationByHash: {
        break;
      }
      case UserOperationMethod.GetOperationReceipt: {
        params = [payload];
        break;
      }
      case UserOperationMethod.GetSupportedEntryPoints: {
        params = [];
        // no params
        break;
      }
      case UserOperationMethod.SendOperation: {
        params = [...payload, entrypoint];
        break;
      }
      default:
        throw new Error(
          `[UserOperationBundlerController] Unknown user operation method ${userOperationMethod}`,
        );
    }

    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: userOperationMethod,
        params,
      }),
    });

    const json = await response.json();
    if (json.error) {
      throw new Error(json.error.message);
    }

    return json;
  }
}
