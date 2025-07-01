import { CaipChainId, Hex } from '@metamask/utils';
import { KeyringTypes } from '@metamask/keyring-controller';
import { MultichainNetworkConfiguration } from '@metamask/multichain-network-controller';
import { useMemo, useRef } from 'react';
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
      return [];
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

  // Use a ref to track the previous network7702List to prevent unnecessary remounts
  const prevNetwork7702ListRef = useRef<EIP7702NetworkConfiguration[]>([]);

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

      // Compare with previous result to prevent unnecessary remounts
      const prevList = prevNetwork7702ListRef.current;
      if (
        prevList.length === networksSupporting7702.length &&
        prevList.every((prevNetwork, index) => {
          const currentNetwork = networksSupporting7702[index];
          return (
            prevNetwork.chainIdHex === currentNetwork.chainIdHex &&
            prevNetwork.isSupported === currentNetwork.isSupported &&
            prevNetwork.upgradeContractAddress ===
              currentNetwork.upgradeContractAddress &&
            prevNetwork.name === currentNetwork.name
          );
        })
      ) {
        return prevList;
      }

      // Update ref and return new list
      prevNetwork7702ListRef.current = networksSupporting7702;
      return networksSupporting7702;
    }, [isSupportedKeyringType, networkList, value]);

  return {
    network7702List,
    networkSupporting7702Present: network7702List?.length > 0,
    pending: pending && isSupportedKeyringType,
  };
};
