import { ERC1155, ERC20, ERC721 } from '@metamask/controller-utils';
import log from 'loglevel';

import { STATIC_MAINNET_TOKEN_LIST } from '../../../../../shared/constants/tokens';
import { getTokensControllerAllTokens } from '../../../../../shared/lib/selectors/assets-migration';
import { isEqualCaseInsensitive } from '../../../../../shared/lib/string-utils';
import {
  fetchERC1155Balance,
  fetchTokenBalance,
} from '../../../../../shared/lib/token-util';

export const TOKEN_RESOLUTION_ACTIONS = [
  'TokenResolution:getTokenStandardAndDetails',
  'TokenResolution:getTokenStandardAndDetailsByChain',
  'TokenResolution:getBalancesInSingleCall',
] as const;

type TokenResolutionAction = (typeof TOKEN_RESOLUTION_ACTIONS)[number];

type NetworkControllerState = {
  networkConfigurationsByChainId?: Record<
    string,
    {
      defaultRpcEndpointIndex?: number;
      rpcEndpoints?: { networkClientId?: string }[];
    }
  >;
};

type TokenResolutionDependencies = {
  getGlobalChainId: () => string;
  getMetaMaskState: () => Record<string, unknown>;
  getNetworkControllerState: () => NetworkControllerState;
  getProvider: () => unknown;
  getSelectedAccount: () => { address: string };
};

export type TokenResolutionMessenger = {
  call(
    action: 'AssetsContractController:getBalancesInSingleCall',
    selectedAddress: string,
    tokensToDetect: string[],
    networkClientId?: string,
  ): Promise<unknown>;
  call(
    action: 'AssetsContractController:getTokenStandardAndDetails',
    address: string,
    userAddress?: string,
    tokenId?: string,
    networkClientId?: string,
  ): Promise<
    | {
        balance?: string | number | bigint | { toString(radix?: number): string };
        decimals?:
          | string
          | number
          | bigint
          | { toString(radix?: number): string };
        standard?: string;
        symbol?: string;
      }
    | undefined
  >;
  registerActionHandler(
    action: TokenResolutionAction,
    handler: (...args: unknown[]) => unknown,
  ): void;
};

function stringifyError(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function getTokenDetails(
  { getMetaMaskState }: TokenResolutionDependencies,
  address: string,
  chainId: string,
  accountAddress: string | undefined,
) {
  const { tokensChainsCache } = getMetaMaskState() as {
    tokensChainsCache?: Record<
      string,
      { data?: Record<string, Record<string, unknown>> }
    >;
  };
  const tokenList = tokensChainsCache?.[chainId]?.data || {};
  const allTokens = getTokensControllerAllTokens({
    metamask: getMetaMaskState(),
  } as never) as Record<string, Record<string, { address: string }[]>>;
  const tokens = accountAddress
    ? allTokens?.[chainId]?.[accountAddress] || []
    : [];

  let staticTokenListDetails = {};
  if (chainId === '0x1') {
    staticTokenListDetails =
      STATIC_MAINNET_TOKEN_LIST[address?.toLowerCase()] || {};
  }

  const tokenListDetails = tokenList[address?.toLowerCase()] || {};
  const userDefinedTokenDetails =
    tokens.find(({ address: tokenAddress }: { address: string }) =>
      isEqualCaseInsensitive(tokenAddress, address),
    ) || {};

  return {
    ...staticTokenListDetails,
    ...tokenListDetails,
    ...userDefinedTokenDetails,
  } as {
    decimals?: number | string;
    erc20?: boolean;
    erc721?: boolean;
    standard?: string;
    symbol?: string;
  };
}

function getNetworkClientIdForChain(
  { getNetworkControllerState }: TokenResolutionDependencies,
  chainId: string,
) {
  const networkConfiguration =
    getNetworkControllerState().networkConfigurationsByChainId?.[chainId];

  return networkConfiguration?.rpcEndpoints?.[
    networkConfiguration.defaultRpcEndpointIndex ?? 0
  ]?.networkClientId;
}

export async function getBalancesInSingleCall(
  messenger: TokenResolutionMessenger,
  selectedAddress: string,
  tokensToDetect: string[],
  networkClientId?: string,
) {
  return await messenger.call(
    'AssetsContractController:getBalancesInSingleCall',
    selectedAddress,
    tokensToDetect,
    networkClientId,
  );
}

export async function getTokenStandardAndDetails(
  messenger: TokenResolutionMessenger,
  dependencies: TokenResolutionDependencies,
  address: string,
  userAddress?: string,
  tokenId?: string,
) {
  const currentChainId = dependencies.getGlobalChainId();
  const tokenDetails = getTokenDetails(
    dependencies,
    address,
    currentChainId,
    userAddress,
  );

  const tokenDetailsStandardIsERC20 =
    isEqualCaseInsensitive(tokenDetails.standard ?? '', ERC20) ||
    tokenDetails.erc20 === true;

  const noEvidenceThatTokenIsAnNFT =
    !tokenId &&
    !isEqualCaseInsensitive(tokenDetails.standard ?? '', ERC1155) &&
    !isEqualCaseInsensitive(tokenDetails.standard ?? '', ERC721) &&
    !tokenDetails.erc721;

  const otherDetailsAreERC20Like =
    tokenDetails.decimals !== undefined && tokenDetails.symbol;

  const tokenCanBeTreatedAsAnERC20 =
    tokenDetailsStandardIsERC20 ||
    (noEvidenceThatTokenIsAnNFT && otherDetailsAreERC20Like);

  let details;
  if (tokenCanBeTreatedAsAnERC20) {
    try {
      const balance = userAddress
        ? await fetchTokenBalance(
            address,
            userAddress,
            dependencies.getProvider() as never,
          )
        : undefined;

      details = {
        address,
        balance,
        standard: ERC20,
        decimals: tokenDetails.decimals,
        symbol: tokenDetails.symbol,
      };
    } catch (error) {
      log.warn(`Failed to get token balance. Error: ${stringifyError(error)}`);
    }
  }

  if (details === undefined) {
    try {
      details = await messenger.call(
        'AssetsContractController:getTokenStandardAndDetails',
        address,
        userAddress,
        tokenId,
      );
    } catch (error) {
      log.warn(
        `Failed to get token standard and details. Error: ${stringifyError(
          error,
        )}`,
      );
    }
  }

  if (details && isEqualCaseInsensitive(details.standard ?? '', ERC1155)) {
    try {
      const balance = await fetchERC1155Balance(
        address,
        userAddress as string,
        tokenId as string,
        dependencies.getProvider() as never,
      );

      details = {
        ...details,
        balance: balance?._hex ? parseInt(balance._hex, 16).toString() : null,
      };
    } catch (error) {
      log.warn('Failed to get token balance. Error:', error);
    }
  }

  return {
    ...details,
    decimals: details?.decimals?.toString(10),
    balance: details?.balance?.toString(10),
  };
}

export async function getTokenStandardAndDetailsByChain(
  messenger: TokenResolutionMessenger,
  dependencies: TokenResolutionDependencies,
  address: string,
  userAddress: string | undefined,
  tokenId: string | undefined,
  chainId: string,
) {
  const selectedAccount = dependencies.getSelectedAccount();
  const tokenDetails = getTokenDetails(
    dependencies,
    address,
    chainId,
    selectedAccount.address,
  );

  const tokenDetailsStandardIsERC20 =
    isEqualCaseInsensitive(tokenDetails.standard ?? '', ERC20) ||
    tokenDetails.erc20 === true;

  const noEvidenceThatTokenIsAnNFT =
    !tokenId &&
    !isEqualCaseInsensitive(tokenDetails.standard ?? '', ERC1155) &&
    !isEqualCaseInsensitive(tokenDetails.standard ?? '', ERC721) &&
    !tokenDetails.erc721;

  const otherDetailsAreERC20Like =
    tokenDetails.decimals !== undefined && tokenDetails.symbol;

  const tokenCanBeTreatedAsAnERC20 =
    tokenDetailsStandardIsERC20 ||
    (noEvidenceThatTokenIsAnNFT && otherDetailsAreERC20Like);

  let details;
  if (tokenCanBeTreatedAsAnERC20) {
    try {
      let balance = 0;
      if (dependencies.getGlobalChainId() === chainId) {
        balance = await fetchTokenBalance(
          address,
          userAddress as string,
          dependencies.getProvider() as never,
        );
      }

      details = {
        address,
        balance,
        standard: ERC20,
        decimals: tokenDetails.decimals,
        symbol: tokenDetails.symbol,
      };
    } catch (error) {
      log.warn(`Failed to get token balance. Error: ${stringifyError(error)}`);
    }
  }

  if (details === undefined) {
    try {
      details = await messenger.call(
        'AssetsContractController:getTokenStandardAndDetails',
        address,
        userAddress,
        tokenId,
        getNetworkClientIdForChain(dependencies, chainId),
      );
    } catch (error) {
      log.warn(
        `Failed to get token standard and details. Error: ${stringifyError(
          error,
        )}`,
      );
    }
  }

  if (details && isEqualCaseInsensitive(details.standard ?? '', ERC1155)) {
    try {
      const balance = await fetchERC1155Balance(
        address,
        userAddress as string,
        tokenId as string,
        dependencies.getProvider() as never,
      );

      details = {
        ...details,
        balance: balance?._hex ? parseInt(balance._hex, 16).toString() : null,
      };
    } catch (error) {
      log.warn('Failed to get token balance. Error:', error);
    }
  }

  return {
    ...details,
    decimals: details?.decimals?.toString(10),
    balance: details?.balance?.toString(10),
  };
}

export function registerActions(
  messenger: TokenResolutionMessenger,
  dependencies: TokenResolutionDependencies,
) {
  messenger.registerActionHandler(
    'TokenResolution:getTokenStandardAndDetails',
    ((address: string, userAddress?: string, tokenId?: string) =>
      getTokenStandardAndDetails(
        messenger,
        dependencies,
        address,
        userAddress,
        tokenId,
      )) as (...args: unknown[]) => unknown,
  );

  messenger.registerActionHandler(
    'TokenResolution:getTokenStandardAndDetailsByChain',
    ((
      address: string,
      userAddress: string | undefined,
      tokenId: string | undefined,
      chainId: string,
    ) =>
      getTokenStandardAndDetailsByChain(
        messenger,
        dependencies,
        address,
        userAddress,
        tokenId,
        chainId,
      )) as (...args: unknown[]) => unknown,
  );

  messenger.registerActionHandler(
    'TokenResolution:getBalancesInSingleCall',
    ((
      selectedAddress: string,
      tokensToDetect: string[],
      networkClientId?: string,
    ) =>
      getBalancesInSingleCall(
        messenger,
        selectedAddress,
        tokensToDetect,
        networkClientId,
      )) as (...args: unknown[]) => unknown,
  );
}
