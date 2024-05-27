import { isEvmAccountType } from '@metamask/keyring-api';
import { getAllNetworks, getSelectedInternalAccount } from '.';
import { createDeepEqualSelector } from './util';
import { useSelector } from 'react-redux';
import { getProviderConfig } from '../ducks/metamask/metamask';
import { useMemo } from 'react';
import {
  MultiChainNetwork,
  NON_EVM_CHAIN_IDS,
  NON_EVM_CHAIN_ID_TOKEN_IMAGE_MAP,
  NON_EVM_PROVIDER_CONFIGS,
} from '../../shared/constants/non-evm-network';
import { ProviderConfig } from '@metamask/network-controller';
import { parseCaipChainId } from '@metamask/utils';

export type MultichainState = {
  metamask: {
    getMultichainNetworkConfirgurations: any;
  };
};

export function isEvmSelectedAccount(state: MultichainState) {
  const selectedAccount = getSelectedInternalAccount(state);

  return isEvmAccountType(selectedAccount?.type);
}

export const getMultichainNetworkConfirgurations = (state: MultichainState) => {
  return state?.metamask?.getMultichainNetworkConfirgurations ?? {};
};

export const getNonEvmNetworks = createDeepEqualSelector(
  getMultichainNetworkConfirgurations, // not avaialble in the chain controller
  (_): MultiChainNetwork[] => {
    // TODO: need state from the chain controller

    return Object.values(NON_EVM_PROVIDER_CONFIGS);
  },
);

export const useMultichainNetwork = (): {
  caip2: string;
  chainId: string;
  network?: ProviderConfig | MultiChainNetwork;
  isEvmNetwork: boolean;
} => {
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const isEvm = useSelector(isEvmSelectedAccount);
  const nonEvmNetworks = useSelector(getNonEvmNetworks);

  // evm only selectors
  const evmNetworks: ProviderConfig[] = useSelector(getAllNetworks);
  const evmProvider: ProviderConfig = useSelector(getProviderConfig);

  const memoizedResult = useMemo(() => {
    console.log('running memo');
    if (isEvm) {
      return {
        caip2: `eip155:${evmProvider.chainId}`,
        chainId: evmProvider.chainId,
        network: evmNetworks.find(
          (network) => network.chainId === evmProvider.chainId,
        ),
        isEvmNetwork: true,
      };
    }

    // hardcoded for testing
    const nonEvmNetwork = nonEvmNetworks.find((provider) => {
      const accountTypeNameSpace = selectedAccount.type.split(':')[0];

      return (
        parseCaipChainId(provider.caip2).namespace === accountTypeNameSpace
      );
    });

    return {
      caip2: nonEvmNetwork?.caip2 as string,
      chainId: nonEvmNetwork?.chainId as string,
      network: nonEvmNetwork,
      isEvmNetwork: false,
    };
  }, [isEvm, evmProvider, evmNetworks, nonEvmNetworks, selectedAccount]);

  return memoizedResult;
};
