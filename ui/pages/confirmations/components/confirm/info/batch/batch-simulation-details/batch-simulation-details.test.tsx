import React from 'react';
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

const ADDRESS_MOCK = '0x1234567891234567891234567891234567891234';
const ADDRESS_SHORT_MOCK = '0x12345...91234';

const BALANCE_CHANGE_ERC20_MOCK: BalanceChange = {
  asset: {
    address: ADDRESS_MOCK,
    chainId: '0x123',
    standard: TokenStandard.ERC20,
  },
  amount: new BigNumber(123.56),
  fiatAmount: null,
  isApproval: true,
};

const BALANCE_CHANGE_ERC721_MOCK: BalanceChange = {
  asset: {
    address: ADDRESS_MOCK,
    chainId: '0x123',
    standard: TokenStandard.ERC721,
    tokenId: '0x141',
  },
  amount: new BigNumber(1),
  fiatAmount: null,
  isApproval: true,
};

const BALANCE_CHANGE_ERC1155_MOCK: BalanceChange = {
  asset: {
    address: ADDRESS_MOCK,
    chainId: '0x123',
    standard: TokenStandard.ERC1155,
    tokenId: '0x141',
  },
  amount: new BigNumber(123),
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

  it('renders ERC-20 approve row', () => {
    useBatchApproveBalanceChangesMock.mockReturnValue({
      pending: false,
      value: [BALANCE_CHANGE_ERC20_MOCK],
    });

    const { getByText } = render();
    expect(getByText('You approve')).toBeInTheDocument();
    expect(getByText('123.6')).toBeInTheDocument();
    expect(getByText(ADDRESS_SHORT_MOCK)).toBeInTheDocument();
  });

  it('renders ERC-721 approve row', () => {
    useBatchApproveBalanceChangesMock.mockReturnValue({
      pending: false,
      value: [BALANCE_CHANGE_ERC721_MOCK],
    });

    const { getByText } = render();
    expect(getByText('You approve')).toBeInTheDocument();
    expect(getByText('#321')).toBeInTheDocument();
    expect(getByText(ADDRESS_SHORT_MOCK)).toBeInTheDocument();
  });

  it('renders ERC-1155 approve row', () => {
    useBatchApproveBalanceChangesMock.mockReturnValue({
      pending: false,
      value: [BALANCE_CHANGE_ERC1155_MOCK],
    });

    const { getByText } = render();
    expect(getByText('You approve')).toBeInTheDocument();
    expect(getByText('123 #321')).toBeInTheDocument();
    expect(getByText(ADDRESS_SHORT_MOCK)).toBeInTheDocument();
  });

  it('does not render approve row if no approve balance changes', () => {
    const { queryByText } = render();
    expect(queryByText('You approve')).toBeNull();
  });
});
