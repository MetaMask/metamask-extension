import React from 'react';
import configureMockStore from 'redux-mock-store';
import { TransactionContainerType } from '@metamask/transaction-controller';

import {
  getMockConfirmStateForTransaction,
  getMockTokenTransferConfirmState,
} from '../../../../../../../test/data/confirmations/helper';
import { genUnapprovedTokenTransferConfirmation } from '../../../../../../../test/data/confirmations/token-transfer';
import { renderWithConfirmContextProvider } from '../../../../../../../test/lib/confirmations/render-helpers';
import { Confirmation } from '../../../../types/confirm';
import NativeTransferInfo from './native-transfer';

jest.mock('../../../simulation-details/useBalanceChanges', () => ({
  useBalanceChanges: jest.fn(() => ({ pending: false, value: [] })),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({ pathname: '/' }),
  useSearchParams: jest.fn().mockReturnValue([{ get: () => null }]),
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

describe('NativeTransferInfo', () => {
  it('renders correctly', () => {
    const state = getMockTokenTransferConfirmState({});
    const mockStore = configureMockStore([])(state);
    const { container } = renderWithConfirmContextProvider(
      <NativeTransferInfo />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });

  it('reduces the simulation section bottom margin when the enforced simulations row is displayed', () => {
    const state = getMockConfirmStateForTransaction({
      ...genUnapprovedTokenTransferConfirmation({ chainId: '0x5' }),
      containerTypes: [TransactionContainerType.EnforcedSimulations],
    } as Confirmation);
    const mockStore = configureMockStore([])(state);
    const { getByTestId } = renderWithConfirmContextProvider(
      <NativeTransferInfo />,
      mockStore,
    );

    expect(getByTestId('simulation-details-layout').parentElement).toHaveClass(
      'mm-box--margin-bottom-2',
    );
  });
});
