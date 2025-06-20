import React from 'react';

import { toHex } from '@metamask/controller-utils';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import configureStore from '../../../../store/store';
import MultilayerFeeMessage from './multi-layer-fee-message';

const VALUE_MOCK_DECIMAL = 1e15;
const LAYER_2_FEE_MOCK_DECIMAL = 21000000000;
const LAYER_1_FEE_MOCK_DECIMAL = 3000000000;

const VALUE_MOCK_HEX = toHex(VALUE_MOCK_DECIMAL);
const LAYER_2_FEE_MOCK_HEX = toHex(LAYER_2_FEE_MOCK_DECIMAL);
const LAYER_1_FEE_MOCK_HEX = toHex(LAYER_1_FEE_MOCK_DECIMAL);

const TRANSACTION_META_MOCK = {
  txParams: {
    value: VALUE_MOCK_HEX,
  },
  layer1GasFee: LAYER_1_FEE_MOCK_HEX,
};

describe('Multi layer fee message', () => {
  describe('when balance and token price checker is enabled', () => {
    let store;

    beforeEach(() => {
      store = configureStore(mockState);
    });

    afterEach(() => {
      store = null;
    });

    it('should match snapshot', () => {
      const { container } = renderWithProvider(
        <MultilayerFeeMessage
          transaction={TRANSACTION_META_MOCK}
          layer2fee={LAYER_2_FEE_MOCK_HEX}
          nativeCurrency="ETH"
        />,
        store,
      );
      expect(container).toMatchSnapshot();
    });

    it('should contain fee values', () => {
      const { getByText } = renderWithProvider(
        <MultilayerFeeMessage
          transaction={TRANSACTION_META_MOCK}
          layer2fee={LAYER_2_FEE_MOCK_HEX}
          nativeCurrency="ETH"
        />,
        store,
      );

      expect(getByText('Layer 1 fees')).toBeInTheDocument();
      expect(getByText('0.000000003000 ETH')).toBeInTheDocument();

      expect(getByText('Amount + fees')).toBeInTheDocument();
      expect(getByText('0.001000024000 ETH')).toBeInTheDocument();
      expect(getByText('$0.56')).toBeInTheDocument();
    });
  });

  describe('when balance and token price checker is disabled', () => {
    let storeWithPriceCheckerDisabled;

    beforeEach(() => {
      storeWithPriceCheckerDisabled = configureStore({
        ...mockState,
        metamask: {
          ...mockState.metamask,
          useCurrencyRateCheck: false,
        },
      });
    });

    afterEach(() => {
      storeWithPriceCheckerDisabled = null;
    });

    it('should match screenshot', () => {
      const { container } = renderWithProvider(
        <MultilayerFeeMessage
          transaction={TRANSACTION_META_MOCK}
          layer2fee={LAYER_2_FEE_MOCK_HEX}
          nativeCurrency="ETH"
        />,
        storeWithPriceCheckerDisabled,
      );
      expect(container).toMatchSnapshot();
    });

    it('should not contain a fiat value', () => {
      const { queryByText } = renderWithProvider(
        <MultilayerFeeMessage
          transaction={TRANSACTION_META_MOCK}
          layer2fee={LAYER_2_FEE_MOCK_HEX}
          nativeCurrency="ETH"
        />,
        storeWithPriceCheckerDisabled,
      );
      expect(queryByText('$0.56')).not.toBeInTheDocument();
    });
  });
});
