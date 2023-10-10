import { fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { ASSET_TYPES } from '../../../../../shared/constants/transaction';
import { renderWithProvider } from '../../../../../test/jest/rendering';
import SendHexDataRow from './send-hex-data-row';

const middleware = [thunk];
const renderComponent = () => {
  const store = configureMockStore(middleware)({
    metamask: { identities: [], provider: {} },
    send: {
      draftTransaction: {
        userInputHexData: '',
      },
      asset: {
        type: ASSET_TYPES.NATIVE,
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

    it('should enter valid hex in textarea', () => {
      const component = renderComponent();
      const textArea = component.getByTestId('hex-data-area');
      expect(textArea).toBeDefined();
      fireEvent.input(textArea, { target: { value: '0x12345' } });
      expect(component.queryByTestId('hex-data-error-message')).toBeNull();
    });

    it('should enter invalid hex in textarea', async () => {
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
