import React from 'react';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/jest';
import { AssetType } from '../../../../../shared/constants/transaction';
import { SendPage } from '.';

jest.mock('@ethersproject/providers', () => {
  const originalModule = jest.requireActual('@ethersproject/providers');
  return {
    ...originalModule,
    Web3Provider: jest.fn().mockImplementation(() => {
      return {};
    }),
  };
});

const render = (props = {}) => {
  const store = configureStore({
    ...mockState,
    send: {
      ...mockState.send,
      currentTransactionUUID: 'uuid',
      draftTransactions: {
        uuid: {
          asset: { type: AssetType.native },
          amount: {},
        },
      },
    },
  });
  return renderWithProvider(<SendPage {...props} />, store);
};

describe('SendPage', () => {
  describe('render', () => {
    it('renders correctly', () => {
      const { container, getByTestId } = render();
      ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
      const currentInput = container.querySelector(
        '.ens-input__wrapper__input',
      );
      expect(currentInput.placeholder).toStrictEqual(
        'Enter public address (0x) or domain name',
      );
      const newInput = currentInput;
      newInput.placeholder = 'Enter public address (Ox) or ENS name';
      container.replaceWith(currentInput, newInput);
      ///: END:ONLY_INCLUDE_IF
      expect(container).toMatchSnapshot();

      expect(getByTestId('send-page-network-picker')).toBeInTheDocument();
    });
  });
});
