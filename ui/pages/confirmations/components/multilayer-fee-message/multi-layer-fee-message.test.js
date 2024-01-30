import React from 'react';

import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import configureStore from '../../../../store/store';
import MultilayerFeeMessage from './multi-layer-fee-message';

jest.mock(
  '../../../../helpers/utils/optimism/fetchEstimatedL1Fee',
  () => '0x5',
);

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
          transaction={{
            txParams: {
              value: '0x38d7ea4c68000',
            },
          }}
          layer2fee="0x4e3b29200"
          nativeCurrency="ETH"
        />,
        store,
      );
      expect(container).toMatchSnapshot();
    });

    it('should contain fee values', () => {
      const { getByText } = renderWithProvider(
        <MultilayerFeeMessage
          transaction={{
            txParams: {
              value: '0x38d7ea4c68000',
            },
          }}
          layer2fee="0x4e3b29200"
          nativeCurrency="ETH"
        />,
        store,
      );
      expect(getByText('Layer 1 fees')).toBeInTheDocument();
      expect(getByText('Amount + fees')).toBeInTheDocument();
      expect(getByText('0.001000021000 ETH')).toBeInTheDocument();
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
          transaction={{
            txParams: {
              value: '0x38d7ea4c68000',
            },
          }}
          layer2fee="0x4e3b29200"
          nativeCurrency="ETH"
        />,
        storeWithPriceCheckerDisabled,
      );
      expect(container).toMatchSnapshot();
    });

    it('should not contain a fiat value', () => {
      const { queryByText } = renderWithProvider(
        <MultilayerFeeMessage
          transaction={{
            txParams: {
              value: '0x38d7ea4c68000',
            },
          }}
          layer2fee="0x4e3b29200"
          nativeCurrency="ETH"
        />,
        storeWithPriceCheckerDisabled,
      );
      expect(queryByText('$0.56')).not.toBeInTheDocument();
    });
  });
});
