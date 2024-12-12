import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { Hex } from '@metamask/utils';
import {
  getMockConfirmState,
  getMockConfirmStateForTransaction,
  getMockContractInteractionConfirmState,
} from '../../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import { CHAIN_IDS } from '../../../../../../../../shared/constants/network';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../../test/data/confirmations/contract-interaction';
import { TransactionDetails } from './transaction-details';

jest.mock(
  '../../../../../../../components/app/alert-system/contexts/alertMetricsContext',
  () => ({
    useAlertMetrics: jest.fn(() => ({
      trackAlertMetrics: jest.fn(),
    })),
  }),
);

describe('<TransactionDetails />', () => {
  const middleware = [thunk];

  it('does not render component for transaction details', () => {
    const state = getMockConfirmState();
    const mockStore = configureMockStore(middleware)(state);
    const { container } = renderWithConfirmContextProvider(
      <TransactionDetails />,
      mockStore,
    );
    expect(container).toMatchSnapshot();
  });

  it('renders component for transaction details', () => {
    const state = getMockContractInteractionConfirmState();
    const mockStore = configureMockStore(middleware)(state);
    const { container } = renderWithConfirmContextProvider(
      <TransactionDetails />,
      mockStore,
    );
    expect(container).toMatchSnapshot();
  });

  describe('AmountRow', () => {
    describe('should be in the document', () => {
      it('when showAdvancedDetails is true', () => {
        const contractInteraction =
          genUnapprovedContractInteractionConfirmation({
            chainId: CHAIN_IDS.GOERLI,
          });
        const state = getMockConfirmStateForTransaction(contractInteraction, {
          metamask: {
            preferences: {
              showConfirmationAdvancedDetails: true,
            },
          },
        });
        const mockStore = configureMockStore(middleware)(state);
        const { getByTestId } = renderWithConfirmContextProvider(
          <TransactionDetails />,
          mockStore,
        );
        expect(
          getByTestId('transaction-details-amount-row'),
        ).toBeInTheDocument();
      });

      it('when value and simulated native balance mismatch', () => {
        // Transaction value is set to 0x3782dace9d900000 below mock
        const simulationDataMock = {
          tokenBalanceChanges: [],
          nativeBalanceChange: {
            difference: '0x1' as Hex,
            isDecrease: false,
            previousBalance: '0x2' as Hex,
            newBalance: '0x1' as Hex,
          },
        };
        const contractInteraction =
          genUnapprovedContractInteractionConfirmation({
            simulationData: simulationDataMock,
            chainId: CHAIN_IDS.GOERLI,
          });
        const state = getMockConfirmStateForTransaction(contractInteraction, {
          metamask: {
            preferences: {
              // Intentionally setting to false to test the condition
              showConfirmationAdvancedDetails: false,
            },
          },
        });
        const mockStore = configureMockStore(middleware)(state);
        const { getByTestId } = renderWithConfirmContextProvider(
          <TransactionDetails />,
          mockStore,
        );
        expect(
          getByTestId('transaction-details-amount-row'),
        ).toBeInTheDocument();
      });
    });

    it('should not be in the document when value and simulated native balance mismatch is within threshold', () => {
      // Transaction value is set to 0x3782dace9d900000 below mock
      const simulationDataMock = {
        tokenBalanceChanges: [],
        nativeBalanceChange: {
          difference: '0x3782dace9d900000' as Hex,
          isDecrease: true,
          previousBalance: '0x3782dace9d900001' as Hex,
          newBalance: '0x0000000000000001' as Hex,
        },
      };
      const contractInteraction = genUnapprovedContractInteractionConfirmation({
        simulationData: simulationDataMock,
        chainId: CHAIN_IDS.GOERLI,
      });
      const state = getMockConfirmStateForTransaction(contractInteraction, {
        metamask: {
          preferences: {
            // Intentionally setting to false to test the condition
            showConfirmationAdvancedDetails: false,
          },
        },
      });
      const mockStore = configureMockStore(middleware)(state);
      const { queryByTestId } = renderWithConfirmContextProvider(
        <TransactionDetails />,
        mockStore,
      );
      expect(
        queryByTestId('transaction-details-amount-row'),
      ).not.toBeInTheDocument();
    });
  });
});
