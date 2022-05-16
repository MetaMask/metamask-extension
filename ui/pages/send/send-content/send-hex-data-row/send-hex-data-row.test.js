import { fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import configureStore from '../../../../store/store';
import { ASSET_TYPES } from '../../../../../shared/constants/transaction';
import { renderWithProvider } from '../../../../../test/jest/rendering';
import { AMOUNT_MODES } from '../../../../ducks/send';
import { GAS_LIMITS } from '../../../../../shared/constants/gas';
import SendHexDataRow from './send-hex-data-row';

const renderComponent = () => {
  const store = configureStore({
    metamask: { identities: [], provider: {} },
    send: {
      userInputHexData: {
        input: '',
        error: null,
      },
      asset: {
        type: ASSET_TYPES.NATIVE,
      },
      history: [],
      amount: {
        mode: AMOUNT_MODES.INPUT,
        value: '0x0',
        error: null,
      },
      gas: {
        isGasEstimateLoading: true,
        gasEstimatePollToken: null,
        isCustomGasSet: false,
        gasLimit: '0x0',
        gasPrice: '0x0',
        maxFeePerGas: '0x0',
        maxPriorityFeePerGas: '0x0',
        gasPriceEstimate: '0x0',
        gasTotal: '0x0',
        minimumGasLimit: GAS_LIMITS.SIMPLE,
        error: null,
      },
    },
  });
  return renderWithProvider(<SendHexDataRow />, store);
};

describe('send-hex-data-row container', () => {
  describe('render', () => {
    it('should render a SendHexData component', () => {
      expect(() => {
        renderComponent();
      }).not.toThrow();
    });

    it('should render a textarea', () => {
      const component = renderComponent();
      const textArea = component.getByTestId('hex-data-area');
      expect(textArea).toBeDefined();
      expect(textArea.nodeName).toStrictEqual('TEXTAREA');
      expect(component.getByPlaceholderText('Optional').nodeName).toStrictEqual(
        'TEXTAREA',
      );
    });

    it('should not render invalid hex error when valid hex is entered in textarea', () => {
      const component = renderComponent();
      const textArea = component.getByTestId('hex-data-area');
      expect(textArea).toBeDefined();
      fireEvent.input(textArea, { target: { value: '0x12345' } });
      expect(component.queryByTestId('hex-data-error-message')).toBeNull();
    });

    it('should render invalid hex data error when invalid hex is entered in textarea', async () => {
      const component = renderComponent();
      const textArea = component.getByTestId('hex-data-area');
      expect(textArea).toBeDefined();
      fireEvent.input(textArea, { target: { value: 'invalid hex' } });
      await waitFor(() => {
        expect(
          component.getByText('Hex Data is an invalid hexadecimal string.', {
            exact: false,
          }),
        ).toBeInTheDocument();
      });
    });
  });
});
