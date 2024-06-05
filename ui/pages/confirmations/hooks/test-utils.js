import { useSelector } from 'react-redux';

import { GasEstimateTypes } from '../../../../shared/constants/gas';
import {
  getConversionRate,
  getNativeCurrency,
} from '../../../ducks/metamask/metamask';
import {
  getCurrentCurrency,
  getShouldShowFiat,
  getPreferences,
  txDataSelector,
  getCurrentKeyring,
  getTokenExchangeRates,
} from '../../../selectors';

import {
  getCustomMaxFeePerGas,
  getCustomMaxPriorityFeePerGas,
} from '../../../ducks/swaps/swaps';
import { Numeric } from '../../../../shared/modules/Numeric';
import { EtherDenomination } from '../../../../shared/constants/common';
import { useGasFeeEstimates } from '../../../hooks/useGasFeeEstimates';

// Why this number?
// 20 gwei * 21000 gasLimit = 420,000 gwei
// 420,000 gwei is 0.00042 ETH
// 0.00042 ETH * 100000 = $42
export const MOCK_ETH_USD_CONVERSION_RATE = 100000;

export const LEGACY_GAS_ESTIMATE_RETURN_VALUE = {
  gasEstimateType: GasEstimateTypes.legacy,
  gasFeeEstimates: {
    low: '10',
    medium: '20',
    high: '30',
  },
  estimatedGasFeeTimeBounds: {},
};

export const FEE_MARKET_ESTIMATE_RETURN_VALUE = {
  gasEstimateType: GasEstimateTypes.feeMarket,
  gasFeeEstimates: {
    low: {
      minWaitTimeEstimate: 180000,
      maxWaitTimeEstimate: 300000,
      suggestedMaxPriorityFeePerGas: '3',
      suggestedMaxFeePerGas: '53',
    },
    medium: {
      minWaitTimeEstimate: 15000,
      maxWaitTimeEstimate: 60000,
      suggestedMaxPriorityFeePerGas: '7',
      suggestedMaxFeePerGas: '70',
    },
    high: {
      minWaitTimeEstimate: 0,
      maxWaitTimeEstimate: 15000,
      suggestedMaxPriorityFeePerGas: '10',
      suggestedMaxFeePerGas: '100',
    },
    estimatedBaseFee: '50',
  },
  estimatedGasFeeTimeBounds: {},
};

export const HIGH_FEE_MARKET_ESTIMATE_RETURN_VALUE = {
  gasEstimateType: GasEstimateTypes.feeMarket,
  gasFeeEstimates: {
    low: {
      minWaitTimeEstimate: 180000,
      maxWaitTimeEstimate: 300000,
      suggestedMaxPriorityFeePerGas: '3',
      suggestedMaxFeePerGas: '53000',
    },
    medium: {
      minWaitTimeEstimate: 15000,
      maxWaitTimeEstimate: 60000,
      suggestedMaxPriorityFeePerGas: '7',
      suggestedMaxFeePerGas: '70000',
    },
    high: {
      minWaitTimeEstimate: 0,
      maxWaitTimeEstimate: 15000,
      suggestedMaxPriorityFeePerGas: '10',
      suggestedMaxFeePerGas: '100000',
    },
    estimatedBaseFee: '50000',
  },
  estimatedGasFeeTimeBounds: {},
};

export const generateUseSelectorRouter =
  ({
    checkNetworkAndAccountSupports1559Response,
    shouldShowFiat = true,
  } = {}) =>
  (selector) => {
    if (selector === getConversionRate) {
      return MOCK_ETH_USD_CONVERSION_RATE;
    }
    if (selector === getNativeCurrency) {
      return EtherDenomination.ETH;
    }
    if (selector === getPreferences) {
      return {
        useNativeCurrencyAsPrimaryCurrency: true,
      };
    }
    if (selector === getCurrentCurrency) {
      return 'USD';
    }
    if (selector === getShouldShowFiat) {
      return shouldShowFiat;
    }
    if (selector === txDataSelector) {
      return {
        txParams: {
          value: '0x5555',
        },
      };
    }
    if (selector.toString().includes('getTargetAccount')) {
      return {
        balance: '0x440aa47cc2556',
      };
    }
    if (selector === getCustomMaxFeePerGas) {
      return '0x5208';
    }
    if (selector === getCustomMaxPriorityFeePerGas) {
      return '0x5208';
    }
    if (selector.toString().includes('checkNetworkAndAccountSupports1559')) {
      return checkNetworkAndAccountSupports1559Response;
    }
    if (selector === getCurrentKeyring) {
      return { type: '' };
    }
    if (selector === getTokenExchangeRates) {
      return { '0x1': '1' };
    }
    return undefined;
  };

export function convertFromHexToFiat(value) {
  const val = new Numeric(value, 16).toBase(10).toString();
  return `$${(val * MOCK_ETH_USD_CONVERSION_RATE).toFixed(2)}`;
}

export function convertFromHexToETH(value) {
  const val = new Numeric(value, 16, EtherDenomination.WEI)
    .toBase(10)
    .toDenomination(EtherDenomination.ETH);
  return `${val} ETH`;
}

export const configureEIP1559 = () => {
  useGasFeeEstimates.mockImplementation(() => FEE_MARKET_ESTIMATE_RETURN_VALUE);
  useSelector.mockImplementation(
    generateUseSelectorRouter({
      checkNetworkAndAccountSupports1559Response: true,
    }),
  );
};

export const configureLegacy = () => {
  useGasFeeEstimates.mockImplementation(() => LEGACY_GAS_ESTIMATE_RETURN_VALUE);
  useSelector.mockImplementation(
    generateUseSelectorRouter({
      checkNetworkAndAccountSupports1559Response: false,
    }),
  );
};

export const configure = () => {
  useSelector.mockImplementation(generateUseSelectorRouter());
};
