import { fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import configureStore from '../../../../store/store';
import { renderWithProvider } from '../../../../../test/jest/rendering';
import { INITIAL_SEND_STATE_FOR_EXISTING_DRAFT } from '../../../../../test/jest/mocks';
import SendHexDataRow from './send-hex-data-row';

const renderComponent = () => {
  const store = configureStore({
    metamask: { identities: [], provider: {} },
    send: INITIAL_SEND_STATE_FOR_EXISTING_DRAFT,
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
