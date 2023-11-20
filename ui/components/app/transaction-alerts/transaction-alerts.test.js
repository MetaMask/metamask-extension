import React from 'react';
import { fireEvent } from '@testing-library/react';
import sinon from 'sinon';
import { SECURITY_PROVIDER_MESSAGE_SEVERITY } from '../../../../shared/constants/security-provider';
import { renderWithProvider } from '../../../../test/jest';
import { submittedPendingTransactionsSelector } from '../../../selectors/transactions';
import { useGasFeeContext } from '../../../contexts/gasFee';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import * as txUtil from '../../../../shared/modules/transaction.utils';
import * as metamaskControllerUtils from '../../../../shared/lib/metamask-controller-utils';
import TransactionAlerts from './transaction-alerts';

jest.mock('../../../selectors/transactions', () => {
  return {
    ...jest.requireActual('../../../selectors/transactions'),
    submittedPendingTransactionsSelector: jest.fn(),
  };
});

jest.mock('../../../contexts/gasFee');

function render({
  componentProps = {},
  useGasFeeContextValue = {},
  submittedPendingTransactionsSelectorValue = null,
  mockedStore = mockState,
}) {
  useGasFeeContext.mockReturnValue(useGasFeeContextValue);
  submittedPendingTransactionsSelector.mockReturnValue(
    submittedPendingTransactionsSelectorValue,
  );
  const store = configureStore(mockedStore);
  return renderWithProvider(<TransactionAlerts {...componentProps} />, store);
}

describe('TransactionAlerts', () => {
  it('should display security alert if present', () => {
    const { getByText } = render({
      componentProps: {
        txData: {
          securityAlertResponse: {
            resultType: 'Malicious',
            reason: 'blur_farming',
            description:
              'A SetApprovalForAll request was made on {contract}. We found the operator {operator} to be malicious',
            args: {
              contract: '0xa7206d878c5c3871826dfdb42191c49b1d11f466',
              operator: '0x92a3b9773b1763efa556f55ccbeb20441962d9b2',
            },
          },
          txParams: {
            value: '0x1',
          },
        },
      },
    });
    expect(getByText('This is a deceptive request')).toBeInTheDocument();
  });

  it('should render SecurityProviderBannerMessage component properly', () => {
    const { queryByText } = render({
      componentProps: {
        txData: {
          securityProviderResponse: {
            flagAsDangerous: '?',
            reason: 'Some reason...',
            reason_header: 'Some reason header...',
          },
          txParams: {
            value: '0x1',
          },
        },
      },
    });

    expect(queryByText('Request not verified')).toBeInTheDocument();
    expect(
      queryByText(
        'Because of an error, this request was not verified by the security provider. Proceed with caution.',
      ),
    ).toBeInTheDocument();
    expect(queryByText('OpenSea')).toBeInTheDocument();
  });

  it('should not render SecurityProviderBannerMessage component when flagAsDangerous is not malicious', () => {
    const { queryByText } = render({
      componentProps: {
        txData: {
          securityProviderResponse: {
            flagAsDangerous: SECURITY_PROVIDER_MESSAGE_SEVERITY.NOT_MALICIOUS,
          },
          txParams: {
            value: '0x1',
          },
        },
      },
    });

    expect(queryByText('Request not verified')).toBeNull();
    expect(
      queryByText(
        'Because of an error, this request was not verified by the security provider. Proceed with caution.',
      ),
    ).toBeNull();
    expect(queryByText('OpenSea')).toBeNull();
  });

  describe('when supportsEIP1559 from useGasFeeContext is truthy', () => {
    describe('if hasSimulationError from useGasFeeContext is true', () => {
      it('informs the user that a simulation of the transaction failed', () => {
        const { getByText } = render({
          useGasFeeContextValue: {
            supportsEIP1559: true,
            hasSimulationError: true,
          },
          componentProps: {
            txData: {
              txParams: {
                value: '0x1',
              },
            },
          },
        });

        expect(
          getByText(
            'We were not able to estimate gas. There might be an error in the contract and this transaction may fail.',
          ),
        ).toBeInTheDocument();
      });

      describe('if the user has not acknowledged the failure', () => {
        it('offers the user an option to bypass the warning', () => {
          const { getByText } = render({
            useGasFeeContextValue: {
              supportsEIP1559: true,
              hasSimulationError: true,
            },
            componentProps: {
              txData: {
                txParams: {
                  value: '0x1',
                },
              },
            },
          });
          expect(getByText('I want to proceed anyway')).toBeInTheDocument();
        });

        it('calls setUserAcknowledgedGasMissing if the user bypasses the warning', () => {
          const setUserAcknowledgedGasMissing = jest.fn();
          const { getByText } = render({
            useGasFeeContextValue: {
              supportsEIP1559: true,
              hasSimulationError: true,
            },
            componentProps: {
              setUserAcknowledgedGasMissing,
              txData: {
                txParams: {
                  value: '0x1',
                },
              },
            },
          });
          fireEvent.click(getByText('I want to proceed anyway'));
          expect(setUserAcknowledgedGasMissing).toHaveBeenCalled();
        });
      });

      describe('if the user has already acknowledged the failure', () => {
        it('does not offer the user an option to bypass the warning', () => {
          const { queryByText } = render({
            useGasFeeContextValue: {
              supportsEIP1559: true,
              hasSimulationError: true,
            },
            componentProps: {
              userAcknowledgedGasMissing: true,
              txData: {
                txParams: {
                  value: '0x1',
                },
              },
            },
          });
          expect(
            queryByText('I want to proceed anyway'),
          ).not.toBeInTheDocument();
        });
      });
    });

    describe('if hasSimulationError from useGasFeeContext is falsy', () => {
      it('does not inform the user that a simulation of the transaction failed', () => {
        const { queryByText } = render({
          useGasFeeContextValue: {
            supportsEIP1559: true,
          },
          componentProps: {
            txData: {
              txParams: {
                value: '0x1',
              },
            },
          },
        });
        expect(
          queryByText(
            'We were not able to estimate gas. There might be an error in the contract and this transaction may fail.',
          ),
        ).not.toBeInTheDocument();
      });
    });

    describe('if the length of pendingTransactions is 1', () => {
      it('informs the user that they have a pending transaction', () => {
        const { getByText } = render({
          useGasFeeContextValue: { supportsEIP1559: true },
          submittedPendingTransactionsSelectorValue: [{ some: 'transaction' }],
          componentProps: {
            txData: {
              txParams: {
                value: '0x1',
              },
            },
          },
        });
        expect(
          getByText('You have (1) pending transaction.'),
        ).toBeInTheDocument();
      });
    });

    describe('if the length of pendingTransactions is more than 1', () => {
      it('informs the user that they have pending transactions', () => {
        const { getByText } = render({
          useGasFeeContextValue: { supportsEIP1559: true },
          submittedPendingTransactionsSelectorValue: [
            { some: 'transaction' },
            { some: 'transaction' },
          ],
          componentProps: {
            txData: {
              txParams: {
                value: '0x1',
              },
            },
          },
        });
        expect(
          getByText('You have (2) pending transactions.'),
        ).toBeInTheDocument();
      });
    });

    describe('if the length of pendingTransactions is 0', () => {
      it('does not inform the user that they have pending transactions', () => {
        const { queryByText } = render({
          useGasFeeContextValue: { supportsEIP1559: true },
          submittedPendingTransactionsSelectorValue: [],
          componentProps: {
            txData: {
              txParams: {
                value: '0x1',
              },
            },
          },
        });
        expect(
          queryByText('You have (0) pending transactions.'),
        ).not.toBeInTheDocument();
      });
    });

    describe('if balanceError from useGasFeeContext is falsy', () => {
      it('does not inform the user that they have insufficient funds', () => {
        const { queryByText } = render({
          useGasFeeContextValue: {
            supportsEIP1559: true,
            balanceError: false,
          },
          componentProps: {
            txData: {
              txParams: {
                value: '0x1',
              },
            },
          },
        });
        expect(queryByText('Insufficient funds.')).not.toBeInTheDocument();
      });
    });

    describe('if estimateUsed from useGasFeeContext is "low"', () => {
      it('informs the user that the current transaction is queued', () => {
        const { getByText } = render({
          useGasFeeContextValue: {
            supportsEIP1559: true,
            estimateUsed: 'low',
          },
          componentProps: {
            txData: {
              txParams: {
                value: '0x1',
              },
            },
          },
        });
        expect(
          getByText('Future transactions will queue after this one.'),
        ).toBeInTheDocument();
      });
    });

    describe('if estimateUsed from useGasFeeContext is not "low"', () => {
      it('does not inform the user that the current transaction is queued', () => {
        const { queryByText } = render({
          useGasFeeContextValue: {
            supportsEIP1559: true,
            estimateUsed: 'something_else',
          },
          componentProps: {
            txData: {
              txParams: {
                value: '0x1',
              },
            },
          },
        });
        expect(
          queryByText('Future transactions will queue after this one.'),
        ).not.toBeInTheDocument();
      });
    });

    describe('if isNetworkBusy from useGasFeeContext is truthy', () => {
      it('informs the user that the network is busy', () => {
        const { getByText } = render({
          useGasFeeContextValue: {
            supportsEIP1559: true,
            isNetworkBusy: true,
          },
          componentProps: {
            txData: {
              txParams: {
                value: '0x1',
              },
            },
          },
        });
        expect(
          getByText(
            'Network is busy. Gas prices are high and estimates are less accurate.',
          ),
        ).toBeInTheDocument();
      });
    });

    describe('if isNetworkBusy from useGasFeeContext is falsy', () => {
      it('does not inform the user that the network is busy', () => {
        const { queryByText } = render({
          useGasFeeContextValue: {
            supportsEIP1559: true,
            isNetworkBusy: false,
          },
          componentProps: {
            txData: {
              txParams: {
                value: '0x1',
              },
            },
          },
        });
        expect(
          queryByText(
            'Network is busy. Gas prices are high and estimates are less accurate.',
          ),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('when supportsEIP1559 from useGasFeeContext is falsy', () => {
    describe('if hasSimulationError from useGasFeeContext is true', () => {
      it('does not inform the user that a simulation of the transaction failed', () => {
        const { queryByText } = render({
          useGasFeeContextValue: {
            supportsEIP1559: false,
            hasSimulationError: true,
          },
          componentProps: {
            txData: {
              txParams: {
                value: '0x1',
              },
            },
          },
        });

        expect(
          queryByText(
            'We were not able to estimate gas. There might be an error in the contract and this transaction may fail.',
          ),
        ).not.toBeInTheDocument();
      });
    });

    describe('if the length of pendingTransactions is at least 1', () => {
      it('does not informs the user that they have a pending transaction', () => {
        const { queryByText } = render({
          useGasFeeContextValue: { supportsEIP1559: false },
          submittedPendingTransactionsSelectorValue: [{ some: 'transaction' }],
          componentProps: {
            txData: {
              txParams: {
                value: '0x1',
              },
            },
          },
        });
        expect(
          queryByText('You have (1) pending transaction.'),
        ).not.toBeInTheDocument();
      });
    });

    describe('if balanceError from useGasFeeContext is true', () => {
      it('informs the user that they have insufficient funds', () => {
        const { queryByText } = render({
          useGasFeeContextValue: {
            supportsEIP1559: false,
            balanceError: true,
          },
          componentProps: {
            txData: {
              txParams: {
                value: '0x1',
              },
            },
          },
        });
        expect(queryByText('Insufficient funds.')).not.toBeInTheDocument();
      });
    });

    describe('if estimateUsed from useGasFeeContext is "low"', () => {
      it('informs the user that the current transaction is queued', () => {
        const { queryByText } = render({
          useGasFeeContextValue: {
            supportsEIP1559: false,
            estimateUsed: 'low',
          },
          componentProps: {
            txData: {
              txParams: {
                value: '0x1',
              },
            },
          },
        });
        expect(
          queryByText(
            'Future transactions will queue after this one. This price was last seen was some time ago.',
          ),
        ).not.toBeInTheDocument();
      });
    });

    describe('if isNetworkBusy from useGasFeeContext is truthy', () => {
      it('does not inform the user that the network is busy', () => {
        const { queryByText } = render({
          useGasFeeContextValue: {
            supportsEIP1559: false,
            isNetworkBusy: true,
          },
          componentProps: {
            txData: {
              txParams: {
                value: '0x1',
              },
            },
          },
        });
        expect(
          queryByText(
            'Network is busy. Gas prices are high and estimates are less accurate.',
          ),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('when sending zero amount it should display a warning', () => {
    it('should display alert if sending zero tokens', () => {
      // Mock
      const testTokenData = {
        args: 'decoded-param',
      };
      const testTokenValue = '0';

      const parseStandardTokenTransactionDataStub = sinon.stub(
        txUtil,
        'parseStandardTokenTransactionData',
      );
      const getTokenValueStub = sinon.stub(
        metamaskControllerUtils,
        'getTokenValueParam',
      );

      parseStandardTokenTransactionDataStub.callsFake(() => testTokenData);
      getTokenValueStub.callsFake(() => testTokenValue);
      // render
      const { getByText } = render({
        componentProps: {
          txData: {
            txParams: {
              value: '0x0',
            },
            type: 'transfer',
          },
          tokenSymbol: 'DAI',
        },
      });
      // assert
      expect(getByText('You are sending 0 DAI.')).toBeInTheDocument();
    });

    it('should display alert if sending zero of native currency', () => {
      const { getByText } = render({
        componentProps: {
          txData: {
            txParams: {
              value: '0x0',
            },
            type: 'simpleSend',
          },
          tokenSymbol: undefined,
        },
      });
      expect(getByText('You are sending 0 ETH.')).toBeInTheDocument();
    });
  });

  describe('when sending amount different than zero should not display alert', () => {
    it('should not display alerts if sending amount different than zero in native currency', () => {
      const { queryByText } = render({
        componentProps: {
          txData: {
            txParams: {
              value: '0x5af3107a4000',
            },
          },
          tokenSymbol: undefined,
        },
      });
      expect(queryByText('You are sending 0 ETH.')).not.toBeInTheDocument();
    });

    it('should not display alerts if sending amount different than zero in tokens', () => {
      const { queryByText } = render({
        componentProps: {
          txData: {
            txParams: {
              value: '0x0',
            },
          },
          tokenSymbol: 'DAI',
        },
      });
      expect(queryByText('You are sending 0 DAI.')).not.toBeInTheDocument();
    });
  });
});
