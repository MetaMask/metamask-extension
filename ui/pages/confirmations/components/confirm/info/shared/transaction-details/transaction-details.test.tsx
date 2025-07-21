import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { Hex } from '@metamask/utils';
import { toHex } from '@metamask/controller-utils';
import {
  getMockConfirmState,
  getMockConfirmStateForTransaction,
  getMockContractInteractionConfirmState,
} from '../../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import { CHAIN_IDS } from '../../../../../../../../shared/constants/network';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../../test/data/confirmations/contract-interaction';
import {
  downgradeAccountConfirmation,
  upgradeAccountConfirmationOnly,
} from '../../../../../../../../test/data/confirmations/batch-transaction';
import { RowAlertKey } from '../../../../../../../components/app/confirm/info/row/constants';
import { Severity } from '../../../../../../../helpers/constants/design-system';
import { RecipientRow, TransactionDetails } from './transaction-details';

jest.mock(
  '../../../../../../../components/app/alert-system/contexts/alertMetricsContext',
  () => ({
    useAlertMetrics: jest.fn(() => ({
      trackAlertMetrics: jest.fn(),
    })),
  }),
);

describe('Transaction Details', () => {
  const middleware = [thunk];

  describe('<TransactionDetails />', () => {
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
        const transactionValueInDecimal = 4000000000000000000;
        const transactionValueInHex = toHex(transactionValueInDecimal);
        const newBalanceInDecimal = 1;
        const newBalanceInHex = toHex(newBalanceInDecimal);
        const previousBalanceInDecimal =
          transactionValueInDecimal + newBalanceInDecimal;
        const previousBalanceInHex = toHex(previousBalanceInDecimal);

        const simulationDataMock = {
          tokenBalanceChanges: [],
          nativeBalanceChange: {
            difference: transactionValueInHex,
            isDecrease: true,
            previousBalance: previousBalanceInHex,
            newBalance: newBalanceInHex,
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
        const { queryByTestId } = renderWithConfirmContextProvider(
          <TransactionDetails />,
          mockStore,
        );
        expect(
          queryByTestId('transaction-details-amount-row'),
        ).not.toBeInTheDocument();
      });
    });

    it('display network info if there is an alert on that field', () => {
      const contractInteraction =
        genUnapprovedContractInteractionConfirmation();
      const state = {
        ...getMockConfirmStateForTransaction(contractInteraction),
        confirmAlerts: {
          alerts: {
            [contractInteraction.id]: [
              {
                key: 'networkSwitchInfo',
                field: RowAlertKey.Network,
                severity: Severity.Info,
                message: 'dummy message',
                reason: 'dummy reason',
              },
            ],
          },
          confirmed: {},
        },
      };
      const mockStore = configureMockStore([])(state);
      const { getByText } = renderWithConfirmContextProvider(
        <TransactionDetails />,
        mockStore,
      );
      expect(getByText('Network')).toBeInTheDocument();
      expect(getByText('Goerli')).toBeInTheDocument();
    });

    describe('RecipientRow', () => {
      it('renders when address is valid', () => {
        const contractInteraction =
          genUnapprovedContractInteractionConfirmation();
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
          getByTestId('transaction-details-recipient-row'),
        ).toBeInTheDocument();
      });

      it('does not render when address is invalid', () => {
        const contractInteraction =
          genUnapprovedContractInteractionConfirmation({
            address: '0xinvalid_address',
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
          getByTestId('transaction-details-recipient-row'),
        ).toBeInTheDocument();
      });
    });

    it('return null for transaction of type revokeDelegation', () => {
      const state = getMockConfirmStateForTransaction(
        downgradeAccountConfirmation,
      );
      const mockStore = configureMockStore([])(state);
      const { container } = renderWithConfirmContextProvider(
        <TransactionDetails />,
        mockStore,
      );
      expect(container.firstChild).toBeNull();
    });

    it('return null for transaction of type smart account upgrade transaction if there are no nested transactions', () => {
      const state = getMockConfirmStateForTransaction(
        upgradeAccountConfirmationOnly,
      );
      const mockStore = configureMockStore([])(state);
      const { container } = renderWithConfirmContextProvider(
        <TransactionDetails />,
        mockStore,
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe('<RecipientRow />', () => {
    const useAdvanceDetails = {
      metamask: {
        preferences: {
          showConfirmationAdvancedDetails: true,
        },
      },
    };
    it('displays SmartContractWithLogo when to and from are equal and there are nested transactions', () => {
      const ADDRESS_MOCK = '0x88aa6343307ec9a652ccddda3646e62b2f1a5125';

      const contractInteraction = genUnapprovedContractInteractionConfirmation({
        address: ADDRESS_MOCK,
        nestedTransactions: [
          {
            to: ADDRESS_MOCK,
            data: '0x1',
          },
        ],
      });
      const state = getMockConfirmStateForTransaction(
        contractInteraction,
        useAdvanceDetails,
      );
      const mockStore = configureMockStore(middleware)(state);
      const { getByTestId } = renderWithConfirmContextProvider(
        <RecipientRow />,
        mockStore,
      );
      expect(
        getByTestId('transaction-details-recipient-row'),
      ).toBeInTheDocument();
      expect(getByTestId('transaction-details-recipient-row')).toContainElement(
        document.querySelector('img[src="images/logo/metamask-fox.svg"]'),
      );
    });

    it('does not display SmartContractWithLogo when to and from are not equal or there are no nested transactions', () => {
      const contractInteraction = genUnapprovedContractInteractionConfirmation({
        address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef',
        nestedTransactions: [
          {
            to: '0x1234567890abcdef1234567890abcdef12345678',
            data: '0x1',
          },
        ],
      });
      const state = getMockConfirmStateForTransaction(
        contractInteraction,
        useAdvanceDetails,
      );
      const mockStore = configureMockStore(middleware)(state);
      const { getByTestId } = renderWithConfirmContextProvider(
        <RecipientRow />,
        mockStore,
      );
      expect(
        getByTestId('transaction-details-recipient-row'),
      ).toBeInTheDocument();
      expect(
        getByTestId('transaction-details-recipient-row'),
      ).not.toContainElement(
        document.querySelector('img[src="images/logo/metamask-fox.svg"]'),
      );
    });
  });
});
