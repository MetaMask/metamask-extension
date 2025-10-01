import { rpcErrors } from '@metamask/rpc-errors';
import type {
  JsonRpcRequest,
  PendingJsonRpcResponse,
  Json,
} from '@metamask/utils';
import type {
  AsyncJsonRpcEngineNextCallback,
  JsonRpcEngineEndCallback,
} from '@metamask/json-rpc-engine';
import type { SnapId } from '@metamask/snaps-sdk';

import { isAccountUpgraded } from '../../../../../shared/lib/eip7702-utils';
import { isSnapPreinstalled } from '../../../../../shared/lib/snaps/snaps';
// eslint-disable-next-line import/no-restricted-paths
import { isFlask } from '../../../../../ui/helpers/utils/build-types';
import { toHex } from '../../../../../shared/lib/delegation/utils';

export type UpgradeAccountParams = {
  account: string; // Address of the EOA to upgrade
  chainId?: number; // Optional: chain ID for the upgrade (defaults to current)
};

export type UpgradeAccountResult = {
  transactionHash: string; // Hash of the EIP-7702 authorization transaction
  upgradedAccount: string; // Address of the upgraded account (same as input)
  delegatedTo: string; // Address of the contract delegated to (determined by wallet)
};

export type GetAccountUpgradeStatusParams = {
  account: string; // Address of the account to check
  chainId?: number; // Optional: chain ID for the check (defaults to current)
};

export type GetAccountUpgradeStatusResult = {
  account: string; // Address of the checked account
  isUpgraded: boolean; // Whether the account is upgraded
  chainId: number; // Chain ID where the check was performed
};

export const upgradeAccountHandler = {
  methodNames: ['wallet_upgradeAccount'],
  implementation: upgradeAccountImplementation,
  hookNames: {
    upgradeAccount: true,
    getCurrentChainId: true,
    isAtomicBatchSupported: true,
  },
};

export const getAccountUpgradeStatusHandler = {
  methodNames: ['wallet_getAccountUpgradeStatus'],
  implementation: getAccountUpgradeStatusImplementation,
  hookNames: {
    getCurrentChainId: true,
    getCode: true,
    getNetworkConfigurationByChainId: true,
  },
};

async function upgradeAccountImplementation(
  req: JsonRpcRequest<Json[]> & { origin: string },
  res: PendingJsonRpcResponse<Json>,
  _next: AsyncJsonRpcEngineNextCallback,
  end: JsonRpcEngineEndCallback,
  {
    upgradeAccount,
    getCurrentChainId,
    isAtomicBatchSupported,
  }: {
    upgradeAccount: (
      address: string,
      upgradeContractAddress: string,
      chainId?: number,
    ) => Promise<{ transactionHash: string; delegatedTo: string }>;
    getCurrentChainId: () => number;
    isAtomicBatchSupported: (request: {
      address: string;
      chainIds: string[];
    }) => Promise<
      {
        chainId: string;
        isSupported: boolean;
        delegationAddress?: string;
        upgradeContractAddress?: string;
      }[]
    >;
  },
) {
  const { params, origin } = req;

  // Check if the origin is a preinstalled snap. If its flask we allow any origin for local development.
  if (!isFlask() && !isSnapPreinstalled(origin as SnapId)) {
    return end(
      rpcErrors.methodNotFound({
        message:
          'wallet_upgradeAccount is only available to preinstalled snaps',
      }),
    );
  }

  if (!Array.isArray(params) || params.length === 0) {
    return end(
      rpcErrors.invalidParams({
        message: 'Expected non-empty array parameter',
      }),
    );
  }

  const [upgradeParams] = params as unknown as [UpgradeAccountParams];
  const { account, chainId } = upgradeParams;

  if (!account) {
    return end(
      rpcErrors.invalidParams({
        message: 'account address is required',
      }),
    );
  }

  // Use current chain ID if not provided
  const targetChainId = chainId ?? getCurrentChainId();

  try {
    // Get the EIP7702 network configuration for the target chain
    const hexChainId = toHex(targetChainId);
    const atomicBatchSupport = await isAtomicBatchSupported({
      address: account,
      chainIds: [hexChainId],
    });

    const atomicBatchChainSupport = atomicBatchSupport.find(
      (result) => result.chainId.toLowerCase() === hexChainId.toLowerCase(),
    );

    const isChainSupported =
      atomicBatchChainSupport &&
      (!atomicBatchChainSupport.delegationAddress ||
        atomicBatchChainSupport.isSupported);

    if (!isChainSupported || !atomicBatchChainSupport?.upgradeContractAddress) {
      return end(
        rpcErrors.invalidParams({
          message: `Account upgrade not supported on chain ID ${targetChainId}`,
        }),
      );
    }

    const { upgradeContractAddress } = atomicBatchChainSupport;

    // Perform the upgrade using existing EIP-7702 functionality
    const result = await upgradeAccount(
      account,
      upgradeContractAddress,
      targetChainId,
    );

    res.result = {
      transactionHash: result.transactionHash,
      upgradedAccount: account,
      delegatedTo: result.delegatedTo,
    } as Json;

    return end();
  } catch (error) {
    return end(
      rpcErrors.internal({
        message: `Failed to upgrade account: ${error instanceof Error ? error.message : String(error)}`,
      }),
    );
  }
}

async function getAccountUpgradeStatusImplementation(
  req: JsonRpcRequest<Json[]> & { origin: string },
  res: PendingJsonRpcResponse<Json>,
  _next: AsyncJsonRpcEngineNextCallback,
  end: JsonRpcEngineEndCallback,
  {
    getCurrentChainId,
    getCode,
    getNetworkConfigurationByChainId,
  }: {
    getCurrentChainId: () => number;
    getCode: (
      address: string,
      networkClientId: string,
    ) => Promise<string | null>;
    getNetworkConfigurationByChainId: (chainId: string) => {
      rpcEndpoints?: { networkClientId: string }[];
      defaultRpcEndpointIndex?: number;
    } | null;
  },
) {
  const { params, origin } = req;

  // Check if the origin is a preinstalled snap. If its flask we allow any origin for local development.
  if (!isFlask() && !isSnapPreinstalled(origin as SnapId)) {
    return end(
      rpcErrors.methodNotFound({
        message:
          'wallet_getAccountUpgradeStatus is only available to preinstalled snaps',
      }),
    );
  }

  if (!Array.isArray(params) || params.length === 0) {
    return end(
      rpcErrors.invalidParams({
        message: 'Expected non-empty array parameter',
      }),
    );
  }

  const [statusParams] = params as unknown as [GetAccountUpgradeStatusParams];
  const { account, chainId } = statusParams;

  if (!account) {
    return end(
      rpcErrors.invalidParams({
        message: 'account address is required',
      }),
    );
  }

  // Use current chain ID if not provided
  const targetChainId = chainId ?? getCurrentChainId();

  try {
    // Get the network configuration for the target chain
    const hexChainId = toHex(targetChainId);
    const networkConfiguration = getNetworkConfigurationByChainId(hexChainId);

    if (!networkConfiguration) {
      return end(
        rpcErrors.invalidParams({
          message: `Network not found for chain ID ${targetChainId}`,
        }),
      );
    }

    // Get the network client ID from the network configuration
    const { rpcEndpoints, defaultRpcEndpointIndex } = networkConfiguration;

    if (!rpcEndpoints || defaultRpcEndpointIndex === undefined) {
      return end(
        rpcErrors.invalidParams({
          message: `Network configuration invalid for chain ID ${targetChainId}`,
        }),
      );
    }

    // Validate that defaultRpcEndpointIndex is within bounds
    if (
      defaultRpcEndpointIndex < 0 ||
      defaultRpcEndpointIndex >= rpcEndpoints.length
    ) {
      return end(
        rpcErrors.invalidParams({
          message: `Invalid RPC endpoint index for chain ID ${targetChainId}`,
        }),
      );
    }

    const { networkClientId } = rpcEndpoints[defaultRpcEndpointIndex];

    if (!networkClientId) {
      return end(
        rpcErrors.invalidParams({
          message: `Network client ID not found for chain ID ${targetChainId}`,
        }),
      );
    }

    // Check if the account is upgraded using the EIP7702 utils
    const isUpgraded = await isAccountUpgraded(
      account as `0x${string}`,
      networkClientId,
      getCode,
    );

    res.result = {
      account,
      isUpgraded,
      chainId: targetChainId,
    } as Json;

    return end();
  } catch (error) {
    return end(
      rpcErrors.internal({
        message: `Failed to get account upgrade status: ${error instanceof Error ? error.message : String(error)}`,
      }),
    );
  }
}
