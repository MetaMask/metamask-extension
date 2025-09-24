import {
  NetworkEnablementController,
  NetworkEnablementControllerState,
} from '@metamask/network-enablement-controller';
import { NetworkEnablementControllerMessenger } from '../messengers/assets';
import { ControllerInitFunction } from '../types';
import { CHAIN_IDS } from '../../../../shared/constants/network';

const generateDefaultNetworkEnablementControllerState =
  (): NetworkEnablementControllerState => {
    if (process.env.IN_TEST) {
      return {
        enabledNetworkMap: {
          eip155: {
            [CHAIN_IDS.LOCALHOST]: true,
            [CHAIN_IDS.SEPOLIA]: false,
            [CHAIN_IDS.MAINNET]: false,
            [CHAIN_IDS.LINEA_MAINNET]: false,
            [CHAIN_IDS.LINEA_SEPOLIA]: false,
            [CHAIN_IDS.BASE]: false,
            [CHAIN_IDS.MEGAETH_TESTNET]: false,
            [CHAIN_IDS.MONAD_TESTNET]: false,
          },
          solana: {
            'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': false,
          },
        },
      };
    } else if (
      process.env.METAMASK_DEBUG ||
      process.env.METAMASK_ENVIRONMENT === 'test'
    ) {
      console.log(
        'process.env.METAMASK_DEBUG ********************',
        process.env.METAMASK_DEBUG,
      );
      return {
        enabledNetworkMap: {
          eip155: {
            [CHAIN_IDS.SEPOLIA]: true,
            [CHAIN_IDS.MAINNET]: false,
            [CHAIN_IDS.LINEA_MAINNET]: false,
            [CHAIN_IDS.LINEA_SEPOLIA]: false,
            [CHAIN_IDS.BASE]: false,
            [CHAIN_IDS.MEGAETH_TESTNET]: false,
            [CHAIN_IDS.MONAD_TESTNET]: false,
          },
          solana: {
            'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': false,
          },
        },
      };
    } else {
      return {
        enabledNetworkMap: {
          eip155: {
            [CHAIN_IDS.SEPOLIA]: false,
            [CHAIN_IDS.MAINNET]: true,
            [CHAIN_IDS.LINEA_MAINNET]: false,
            [CHAIN_IDS.LINEA_SEPOLIA]: false,
            [CHAIN_IDS.BASE]: false,
            [CHAIN_IDS.MEGAETH_TESTNET]: false,
            [CHAIN_IDS.MONAD_TESTNET]: false,
          },
          solana: {
            'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': false,
          },
        },
      };
    }
  };

export const NetworkEnablementControllerInit: ControllerInitFunction<
  NetworkEnablementController,
  NetworkEnablementControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  console.log('persistedState ********************', persistedState);
  const controller = new NetworkEnablementController({
    messenger: controllerMessenger,
    state: {
      ...generateDefaultNetworkEnablementControllerState(),
      ...persistedState.NetworkEnablementController,
    },
  });

  return {
    controller,
  };
};
