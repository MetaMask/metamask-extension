import React from 'react';
import configureMockStore from 'redux-mock-store';
import { TransactionContainerType } from '@metamask/transaction-controller';
import {
  getMockConfirmStateForTransaction,
  getMockTokenTransferConfirmState,
} from '../../../../../../../test/data/confirmations/helper';
import { genUnapprovedTokenTransferConfirmation } from '../../../../../../../test/data/confirmations/token-transfer';
import { renderWithConfirmContextProvider } from '../../../../../../../test/lib/confirmations/render-helpers';
import TokenTransferInfo from './token-transfer';

jest.mock('../../../simulation-details/useBalanceChanges', () => ({
  useBalanceChanges: jest.fn(() => ({ pending: false, value: [] })),
}));

jest.mock(
  '../../../../../../components/app/alert-system/contexts/alertMetricsContext',
  () => ({
    useAlertMetrics: jest.fn(() => ({
      trackAlertMetrics: jest.fn(),
    })),
  }),
);

jest.mock('../../../../../../store/actions', () => ({
  ...jest.requireActual('../../../../../../store/actions'),
  getGasFeeTimeEstimate: jest.fn().mockResolvedValue({
    lowerTimeBound: 0,
    upperTimeBound: 60000,
  }),
}));

jest.mock('../../../../hooks/useAssetDetails', () => ({
  useAssetDetails: jest.fn(() => ({
    decimals: 18,
  })),
}));

jest.mock('../../../../hooks/gas/useIsGaslessSupported', () => ({
  useIsGaslessSupported: jest.fn(() => ({
    isSupported: false,
    isSmartTransaction: false,
    pending: false,
  })),
}));

jest.mock('../../../../hooks/gas/useGasSponsorshipPreference', () => ({
  useGasSponsorshipPreference: jest.fn(() => ({
    isSponsorshipOptedOut: false,
    setSponsorshipOptedOut: jest.fn(),
  })),
}));

describe('TokenTransferInfo', () => {
  it('renders correctly', () => {
    const state = getMockTokenTransferConfirmState({});
    const mockStore = configureMockStore()(state);
    const { container } = renderWithConfirmContextProvider(
      <TokenTransferInfo />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });

  it('reduces the simulation section bottom margin when the enforced simulations row is displayed', () => {
    const state = getMockConfirmStateForTransaction({
      ...genUnapprovedTokenTransferConfirmation({ chainId: '0x5' }),
      containerTypes: [TransactionContainerType.EnforcedSimulations],
    });
    const mockStore = configureMockStore()(state);
    const { getByTestId } = renderWithConfirmContextProvider(
      <TokenTransferInfo />,
      mockStore,
    );

    expect(getByTestId('simulation-details-layout').parentElement).toHaveClass(
      'mm-box--margin-bottom-2',
    );
  });
});
