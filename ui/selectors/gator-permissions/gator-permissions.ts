import type { Hex } from '@metamask/utils';
import {
  deserializeGatorPermissionsList,
  GatorPermissionsList,
  SupportedGatorPermissionType,
  GatorPermissionsListByPermissionType,
  GatorPermissionsListItemsByPermissionTypeAndChainId,
} from '@metamask/gator-permissions-controller';

export type GatorPermissionState = {
  metamask: {
    isGatorPermissionsEnabled: boolean;
    gatorPermissionsListStringify: string;
    isFetchingGatorPermissions: boolean;
  };
};

export type GatorAssetItemListDetail = {
  [chainId: Hex]: {
    total: number;
    description: string;
  };
};

export type GatorAssetListType = 'token-streams' | 'token-subscriptions';

export type GatorAssetListDescriptionLookup = {
  'token-streams': string;
  'token-subscriptions': string;
};

const defaultGatorAssetListDescriptionLookup: GatorAssetListDescriptionLookup =
  {
    'token-streams': 'streaming permissions',
    'token-subscriptions': 'subscription permissions',
  };

/**
 * Get gator permissions list from GatorPermissionsController.
 *
 * @param state - The current state
 * @returns Gator permissions list
 */
export function getGatorPermissionsList(
  state: GatorPermissionState,
): GatorPermissionsList {
  console.log(
    'getGatorPermissionsList: state:',
    state.metamask.gatorPermissionsListStringify,
  );
  console.log(
    'getGatorPermissionsList: state( deserialized):',
    deserializeGatorPermissionsList(
      state.metamask.gatorPermissionsListStringify,
    ),
  );

  // TODO: Remove mock once development is complete (Mock permissions list on mainnet and polygon (0x1 and 0x89))
  const mockGatorPermissionsList: GatorPermissionsList = {
    'native-token-stream': {
      '0x1': [
        {
          permissionResponse: {
            chainId: '0x1',
            address: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
            expiry: 1750291200,
            isAdjustmentAllowed: true,
            signer: {
              type: 'account',
              data: { address: '0x4f71DA06987BfeDE90aF0b33E1e3e4ffDCEE7a63' },
            },
            permission: {
              type: 'native-token-stream',
              data: {
                maxAmount: '0x22b1c8c1227a0000',
                initialAmount: '0x6f05b59d3b20000',
                amountPerSecond: '0x6f05b59d3b20000',
                startTime: 1747699200,
                justification:
                  'This is a very important request for streaming allowance for some very important thing',
              },
              rules: {},
            },
            context: '0x00000000',
            accountMeta: [
              {
                factory: '0x69Aa2f9fe1572F1B640E1bbc512f5c3a734fc77c',
                factoryData: '0x0000000',
              },
            ],
            signerMeta: {
              delegationManager: '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3',
            },
          },
          siteOrigin: 'http://localhost:8000',
        },
      ],
      '0x89': [
        {
          permissionResponse: {
            chainId: '0x89',
            address: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
            expiry: 1750291200,
            isAdjustmentAllowed: true,
            signer: {
              type: 'account',
              data: { address: '0x4f71DA06987BfeDE90aF0b33E1e3e4ffDCEE7a63' },
            },
            permission: {
              type: 'native-token-stream',
              data: {
                maxAmount: '0x22b1c8c1227a0000',
                initialAmount: '0x6f05b59d3b20000',
                amountPerSecond: '0x6f05b59d3b20000',
                startTime: 1747699200,
                justification:
                  'This is a very important request for streaming allowance for some very important thing',
              },
              rules: {},
            },
            context: '0x00000000',
            accountMeta: [
              {
                factory: '0x69Aa2f9fe1572F1B640E1bbc512f5c3a734fc77c',
                factoryData: '0x0000000',
              },
            ],
            signerMeta: {
              delegationManager: '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3',
            },
          },
          siteOrigin: 'http://localhost:8000',
        },
      ],
    },
    'native-token-periodic': {
      '0x1': [
        {
          permissionResponse: {
            chainId: '0x1',
            address: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
            expiry: 1750291200,
            isAdjustmentAllowed: true,
            signer: {
              type: 'account',
              data: { address: '0x4f71DA06987BfeDE90aF0b33E1e3e4ffDCEE7a63' },
            },
            permission: {
              type: 'native-token-periodic',
              data: {
                periodAmount: '0x22b1c8c1227a0000',
                periodDuration: 1747699200,
                startTime: 1747699200,
                justification:
                  'This is a very important request for streaming allowance for some very important thing',
              },
              rules: {},
            },
            context: '0x00000000',
            accountMeta: [
              {
                factory: '0x69Aa2f9fe1572F1B640E1bbc512f5c3a734fc77c',
                factoryData: '0x0000000',
              },
            ],
            signerMeta: {
              delegationManager: '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3',
            },
          },
          siteOrigin: 'http://localhost:8000',
        },
      ],
      '0x89': [
        {
          permissionResponse: {
            chainId: '0x89',
            address: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
            expiry: 1750291200,
            isAdjustmentAllowed: true,
            signer: {
              type: 'account',
              data: { address: '0x4f71DA06987BfeDE90aF0b33E1e3e4ffDCEE7a63' },
            },
            permission: {
              type: 'native-token-periodic',
              data: {
                periodAmount: '0x22b1c8c1227a0000',
                periodDuration: 1747699200,
                startTime: 1747699200,
                justification:
                  'This is a very important request for streaming allowance for some very important thing',
              },
              rules: {},
            },
            context: '0x00000000',
            accountMeta: [
              {
                factory: '0x69Aa2f9fe1572F1B640E1bbc512f5c3a734fc77c',
                factoryData: '0x0000000',
              },
            ],
            signerMeta: {
              delegationManager: '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3',
            },
          },
          siteOrigin: 'http://localhost:8000',
        },
      ],
    },
    'erc20-token-stream': {
      '0x1': [
        {
          permissionResponse: {
            chainId: '0x1',
            address: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
            expiry: 1750291200,
            isAdjustmentAllowed: true,
            signer: {
              type: 'account',
              data: { address: '0x4f71DA06987BfeDE90aF0b33E1e3e4ffDCEE7a63' },
            },
            permission: {
              type: 'erc20-token-stream',
              data: {
                initialAmount: '0x22b1c8c1227a0000',
                maxAmount: '0x6f05b59d3b20000',
                amountPerSecond: '0x6f05b59d3b20000',
                startTime: 1747699200,
                tokenAddress: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
                justification:
                  'This is a very important request for streaming allowance for some very important thing',
              },
              rules: {},
            },
            context: '0x00000000',
            accountMeta: [
              {
                factory: '0x69Aa2f9fe1572F1B640E1bbc512f5c3a734fc77c',
                factoryData: '0x0000000',
              },
            ],
            signerMeta: {
              delegationManager: '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3',
            },
          },
          siteOrigin: 'http://localhost:8000',
        },
      ],
      '0x89': [
        {
          permissionResponse: {
            chainId: '0x89',
            address: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
            expiry: 1750291200,
            isAdjustmentAllowed: true,
            signer: {
              type: 'account',
              data: { address: '0x4f71DA06987BfeDE90aF0b33E1e3e4ffDCEE7a63' },
            },
            permission: {
              type: 'erc20-token-stream',
              data: {
                initialAmount: '0x22b1c8c1227a0000',
                maxAmount: '0x6f05b59d3b20000',
                amountPerSecond: '0x6f05b59d3b20000',
                startTime: 1747699200,
                tokenAddress: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
                justification:
                  'This is a very important request for streaming allowance for some very important thing',
              },
              rules: {},
            },
            context: '0x00000000',
            accountMeta: [
              {
                factory: '0x69Aa2f9fe1572F1B640E1bbc512f5c3a734fc77c',
                factoryData: '0x0000000',
              },
            ],
            signerMeta: {
              delegationManager: '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3',
            },
          },
          siteOrigin: 'http://localhost:8000',
        },
      ],
    },
  };

  return mockGatorPermissionsList;

  // return deserializeGatorPermissionsList(
  //   state.metamask.gatorPermissionsListStringify,
  // );
}

/**
 * Get gator permissions for a specific permission type and chainId.
 *
 * @param state - The current state
 * @param permissionType - The permission type to get permissions for (e.g. 'native-token-stream')
 * @param chainId - The chainId to get permissions for (e.g. 0x1)
 * @returns A list of gator permissions filtered by permission type and chainId.(e.g. [permission1, permission2] on chainId 0x1)
 */
export function getGatorPermissionByPermissionTypeAndChainId<
  T extends SupportedGatorPermissionType,
>(
  state: GatorPermissionState,
  permissionType: T,
  chainId: Hex,
): GatorPermissionsListItemsByPermissionTypeAndChainId<T> {
  const gatorPermissionsList = getGatorPermissionsList(state);
  return gatorPermissionsList[permissionType][chainId] || [];
}

/**
 * Get the total count of gator permissions of a specific permission type across chains.
 *
 * @param permissions - The gator permissions to get the total count of
 * @returns The total count of gator permissions of a specific permission type across chains
 */
function getTotalCountOfGatorPermissionsPerChainId(
  permissionsByPermissionType: GatorPermissionsListByPermissionType<SupportedGatorPermissionType>,
): Record<Hex, number> {
  // Flatten the permissions list all permission types across chains
  const flattenedStoredGatorPermissions = Object.values(
    permissionsByPermissionType,
  ).flat();
  return flattenedStoredGatorPermissions.reduce((acc, gatorPermission) => {
    const { permissionResponse } = gatorPermission;
    acc[permissionResponse.chainId] =
      (acc[permissionResponse.chainId] || 0) + 1;
    return acc;
  }, {} as Record<Hex, number>);
}

/**
 * Merge two records of chainId to total count of gator permissions.
 *
 * @param record1 - The first record to merge
 * @param record2 - The second record to merge
 * @returns A merged record of chainId to total count of gator permissions
 */
function mergeRecords(
  record1: Record<Hex, number>,
  record2: Record<Hex, number>,
): Record<Hex, number> {
  const mergedRecord = { ...record1 };

  for (const [key, value] of Object.entries(record2)) {
    mergedRecord[key] = (mergedRecord[key] || 0) + value;
  }

  return mergedRecord;
}

/**
 * Get gator asset list details.
 *
 * @param state - The current state
 * @param listType - The type of list to get (token-streams or token-subscriptions)
 * @returns A list of gator asset items
 *
 * @example
 * const gatorAssetList = getGatorAssetListDetail(state, 'token-streams');
 *
 * // {
 * //   '0x1': {
 * //     total: 2,
 * //     description: 'streaming permissions',
 * //   },
 * //   '0x89': {
 * //     total: 2,
 * //     description: 'streaming permissions',
 * //   },
 * // }
 */
export function getGatorAssetListDetail(
  state: GatorPermissionState,
  listType: GatorAssetListType,
  descriptionLookup: GatorAssetListDescriptionLookup = defaultGatorAssetListDescriptionLookup,
): GatorAssetItemListDetail {
  const gatorPermissionsList = getGatorPermissionsList(state);

  let permissionsCountPerChainId: Record<Hex, number> = {};

  switch (listType) {
    case 'token-streams': {
      permissionsCountPerChainId = mergeRecords(
        getTotalCountOfGatorPermissionsPerChainId(
          gatorPermissionsList['native-token-stream'],
        ),
        getTotalCountOfGatorPermissionsPerChainId(
          gatorPermissionsList['erc20-token-stream'],
        ),
      );

      break;
    }
    case 'token-subscriptions': {
      permissionsCountPerChainId = getTotalCountOfGatorPermissionsPerChainId(
        gatorPermissionsList['native-token-periodic'],
      );
      break;
    }
    default:
      console.warn(`Unknown list type: ${listType}`);
      break;
  }

  const gatorAssetItemList: GatorAssetItemListDetail = {};
  for (const [chainId, total] of Object.entries(permissionsCountPerChainId)) {
    gatorAssetItemList[chainId] = {
      total,
      description: descriptionLookup[listType] || 'No description',
    };
  }

  return gatorAssetItemList;
}
