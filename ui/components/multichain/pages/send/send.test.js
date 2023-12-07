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
      const expectedPlaceholder =
        // disabled due to some non-determinism with the placeholder values
        // eslint-disable-next-line jest/no-if
        process.env.METAMASK_BUILD_TYPE === 'flask'
          ? 'Enter public address (0x) or domain name'
          : 'Enter public address (0x) or ENS name';
      const currentInput = container.querySelector(
        '.ens-input__wrapper__input',
      );
      expect(currentInput.placeholder).toStrictEqual(expectedPlaceholder);
      const newInput = currentInput.cloneNode(true);
      newInput.placeholder = 'Enter public address (0x) or ENS name';
      currentInput.replaceWith(newInput);
      expect(container).toMatchSnapshot();

      expect(getByTestId('send-page-network-picker')).toBeInTheDocument();
    });
  });
});
