import React from 'react';
import { BatchTransactionParams } from '@metamask/transaction-controller';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import configureStore from '../../../../../../../store/store';
import { getMockConfirmStateForTransaction } from '../../../../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../../test/data/confirmations/contract-interaction';
import { BatchSimulationDetails } from './batch-simulation-details';
import { useBatchApproveBalanceChanges } from '../../hooks/useBatchApproveBalanceChanges';
import { AlertMetricsProvider } from '../../../../../../../components/app/alert-system/contexts/alertMetricsContext';
import { useBalanceChanges } from '../../../../simulation-details/useBalanceChanges';
import BigNumber from 'bignumber.js';
import { BalanceChange } from '../../../../simulation-details/types';
import { TokenStandard } from '../../../../../../../../shared/constants/transaction';

jest.mock('../../../../simulation-details/useBalanceChanges', () => ({
  useBalanceChanges: jest.fn(),
}));

jest.mock('../../hooks/useBatchApproveBalanceChanges', () => ({
  useBatchApproveBalanceChanges: jest.fn(),
}));

const BALANCE_CHANGE_MOCK: BalanceChange = {
  asset: {
    address: '0x1234567891234567891234567891234567891234',
    chainId: '0x123',
    standard: TokenStandard.ERC20,
  },
  amount: new BigNumber('100'),
  fiatAmount: null,
  isApproval: true,
};

function render() {
  const store = configureStore(
    getMockConfirmStateForTransaction(
      genUnapprovedContractInteractionConfirmation({
        simulationData: {
          tokenBalanceChanges: [],
        },
      }),
    ),
  );

  return renderWithConfirmContextProvider(
    <AlertMetricsProvider metrics={{} as never}>
      <BatchSimulationDetails />
    </AlertMetricsProvider>,
    store,
  );
}

describe('BatchSimulationDetails', () => {
  const useBalanceChangesMock = jest.mocked(useBalanceChanges);

  const useBatchApproveBalanceChangesMock = jest.mocked(
    useBatchApproveBalanceChanges,
  );

  beforeEach(() => {
    jest.resetAllMocks();

    useBalanceChangesMock.mockReturnValue({
      pending: false,
      value: [],
    });

    useBatchApproveBalanceChangesMock.mockReturnValue({
      pending: false,
      value: [],
    });
  });

  it('renders approve row if approve balance changes', () => {
    useBatchApproveBalanceChangesMock.mockReturnValue({
      pending: false,
      value: [BALANCE_CHANGE_MOCK],
    });

    const { getByText } = render();
    expect(getByText('You approve')).toBeInTheDocument();
  });

  it('does not render approve row if no approve balance changes', () => {
    const { queryByText } = render();
    expect(queryByText('You approve')).toBeNull();
  });
});
