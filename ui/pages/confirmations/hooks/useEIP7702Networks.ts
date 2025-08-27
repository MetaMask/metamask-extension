import { CaipChainId, Hex } from '@metamask/utils';
import { KeyringTypes } from '@metamask/keyring-controller';
import { MultichainNetworkConfiguration } from '@metamask/multichain-network-controller';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { KEYRING_TYPES_SUPPORTING_7702 } from '../../../../shared/constants/keyring';
import { TEST_CHAINS } from '../../../../shared/constants/network';
import { convertCaipToHexChainId } from '../../../../shared/modules/network.utils';
import {
  AccountsState,
  getMemoizedInternalAccountByAddress,
  getMultichainNetworkConfigurationsByChainId,
} from '../../../selectors';
import { useAsyncResult } from '../../../hooks/useAsync';
import { isAtomicBatchSupported } from '../../../store/controller-actions/transaction-controller';

export type EIP7702NetworkConfiguration = MultichainNetworkConfiguration & {
  chainIdHex: Hex;
  isSupported: boolean;
  upgradeContractAddress?: Hex;
};

export const useEIP7702Networks = (address: string) => {
  const account = useSelector((state: AccountsState) =>
    getMemoizedInternalAccountByAddress(state as AccountsState, address),
  );
  const keyringType = account?.metadata?.keyring?.type;
  const isSupportedKeyringType =
    keyringType &&
    KEYRING_TYPES_SUPPORTING_7702.includes(keyringType as KeyringTypes);

  const [multichainNetworks] = useSelector(
    getMultichainNetworkConfigurationsByChainId,
  );

  const [nonTestNetworks = {}, testNetworks = {}] = useMemo(() => {
    if (!isSupportedKeyringType) {
      // We return empty objects for unsupported keyring types
      return [{}, {}];
    }
    return Object.entries(multichainNetworks).reduce(
      ([nonTestnetsList, testnetsList], [id, network]) => {
        try {
          const chainId = network.isEvm
            ? convertCaipToHexChainId(id as CaipChainId)
            : id;
          // This is type casted to string since chainId could be
          // Hex or CaipChainId.
          const isTest = (TEST_CHAINS as string[]).includes(chainId);
          (isTest ? testnetsList : nonTestnetsList)[chainId] = network;
        } catch (err: unknown) {
          // console.log(err);
        }
        return [nonTestnetsList, testnetsList];
      },
      [
        {} as Record<string, MultichainNetworkConfiguration>,
        {} as Record<string, MultichainNetworkConfiguration>,
      ],
    );
  }, [isSupportedKeyringType, multichainNetworks]);

  const networkList = useMemo(
    () => ({ ...nonTestNetworks, ...testNetworks }),
    [nonTestNetworks, testNetworks],
  );

  const { pending, value } = useAsyncResult(async () => {
    if (!isSupportedKeyringType) {
      return [];
    }

    const chainIds = Object.keys(networkList) as Hex[];

    return await isAtomicBatchSupported({
      address: address as Hex,
      chainIds,
    });
  }, [address, isSupportedKeyringType, networkList]);

  const network7702List: EIP7702NetworkConfiguration[] | undefined =
    useMemo(() => {
      if (!value || !isSupportedKeyringType) {
        return [];
      }

      const networksSupporting7702: EIP7702NetworkConfiguration[] = [];
      Object.values(networkList).forEach((network) => {
        try {
          const chainIdHex = convertCaipToHexChainId(network.chainId);
          const atomicBatchResult = value.find(
            ({ chainId }) => chainId === chainIdHex,
          );
          if (atomicBatchResult) {
            networksSupporting7702.push({
              ...atomicBatchResult,
              ...network,
              chainIdHex,
            });
          }
        } catch (err: unknown) {
          // console.log(err);
        }
      });

      // Sort by chainIdHex to ensure consistent ordering for comparison
      networksSupporting7702.sort((a, b) => {
        const aChainIdNum = parseInt(a.chainIdHex, 16);
        const bChainIdNum = parseInt(b.chainIdHex, 16);
        return aChainIdNum - bChainIdNum;
      });

      return networksSupporting7702;
    }, [isSupportedKeyringType, networkList, value]);

  return {
    network7702List,
    networkSupporting7702Present: network7702List?.length > 0,
    pending: pending && isSupportedKeyringType,
  };
};
