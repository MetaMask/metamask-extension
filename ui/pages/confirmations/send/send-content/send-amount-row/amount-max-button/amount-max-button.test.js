import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { fireEvent } from '@testing-library/react';
import { NetworkType } from '@metamask/controller-utils';
import { AMOUNT_MODES, SEND_STATUSES } from '../../../../../ducks/send';
import { renderWithProvider } from '../../../../../../test/jest';
import { GasEstimateTypes } from '../../../../../../shared/constants/gas';
import {
  getInitialSendStateWithExistingTxState,
  INITIAL_SEND_STATE_FOR_EXISTING_DRAFT,
} from '../../../../../../test/jest/mocks';
import AmountMaxButton from './amount-max-button';

const middleware = [thunk];

describe('AmountMaxButton Component', () => {
  describe('render', () => {
    it('should render a "Max" button', () => {
      const { getByText } = renderWithProvider(
        <AmountMaxButton />,
        configureMockStore(middleware)({
          metamask: {
            gasEstimateType: GasEstimateTypes.none,
            selectedNetworkClientId: NetworkType.mainnet,
            networksMetadata: {
              [NetworkType.mainnet]: {
                EIPS: {},
                status: 'available',
              },
            },
          },
          send: INITIAL_SEND_STATE_FOR_EXISTING_DRAFT,
        }),
      );
      expect(getByText('Max')).toBeTruthy();
    });

    it('should dispatch action to set mode to MAX', () => {
      const store = configureMockStore(middleware)({
        metamask: {
          gasEstimateType: GasEstimateTypes.ethGasPrice,
          selectedNetworkClientId: NetworkType.mainnet,
          networksMetadata: {
            [NetworkType.mainnet]: {
              EIPS: {},
              status: 'available',
            },
          },
        },
        send: getInitialSendStateWithExistingTxState({
          status: SEND_STATUSES.VALID,
        }),
      });
      const { getByText } = renderWithProvider(<AmountMaxButton />, store);

      const expectedActions = [
        { type: 'send/updateAmountMode', payload: AMOUNT_MODES.MAX },
      ];

      fireEvent.click(getByText('Max'), { bubbles: true });
      const actions = store.getActions();
      expect(actions).toStrictEqual(expectedActions);
    });

    it('should dispatch action to set amount mode to INPUT', () => {
      const store = configureMockStore(middleware)({
        metamask: {
          gasEstimateType: GasEstimateTypes.ethGasPrice,
          selectedNetworkClientId: NetworkType.mainnet,
          networksMetadata: {
            [NetworkType.mainnet]: {
              EIPS: {},
              status: 'available',
            },
          },
        },
        send: {
          ...getInitialSendStateWithExistingTxState({
            status: SEND_STATUSES.VALID,
          }),
          amountMode: AMOUNT_MODES.MAX,
        },
      });
      const { getByText } = renderWithProvider(<AmountMaxButton />, store);

      const expectedActions = [
        { type: 'send/updateAmountMode', payload: 'INPUT' },
      ];

      fireEvent.click(getByText('Max'), { bubbles: true });
      const actions = store.getActions();
      expect(actions).toStrictEqual(expectedActions);
    });
  });
});
