import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { getMockApproveConfirmState } from '../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../test/lib/confirmations/render-helpers';
import ApproveInfo from './approve';

jest.mock('../../../../../../store/actions', () => ({
  ...jest.requireActual('../../../../../../store/actions'),
  getGasFeeTimeEstimate: jest.fn().mockResolvedValue({
    lowerTimeBound: 0,
    upperTimeBound: 60000,
  }),
  estimateGas: jest.fn().mockResolvedValue('0x5208'), // Mock estimateGas function
}));

jest.mock(
  '../../../../../../components/app/alert-system/contexts/alertMetricsContext',
  () => ({
    useAlertMetrics: jest.fn(() => ({
      trackAlertMetrics: jest.fn(),
    })),
  }),
);

jest.mock('../../../../confirm-approve/confirm-approve.util', () => ({
  ...jest.requireActual('../../../../confirm-approve/confirm-approve.util'),
  getCustomTxParamsData: jest.fn().mockResolvedValue({
    data: '0x095ea7b30000000000000000000000002e0d7e8c45221fca00d74a3609a0f7097035d09b0000000000000000000000000000000000000000000000000000000000000001',
  }),
}));

jest.mock('../../../../hooks/useAssetDetails', () => ({
  useAssetDetails: jest.fn(() => ({
    decimals: 18,
  })),
}));

jest.mock('../../../../selectors/preferences', () => ({
  selectConfirmationAdvancedDetailsOpen: jest.fn(() => true),
}));

jest.mock('./hooks/use-is-nft', () => ({
  useIsNFT: jest.fn(() => ({
    isNFT: false,
  })),
}));

jest.mock('../../../../../../hooks/useAsyncResult', () => ({
  useAsyncResult: jest.fn((asyncFn, deps) => ({
    value: '0x5208', // Mocked estimatedGasLimit value
  })),
}));

describe('<ApproveInfo />', () => {
  const middleware = [thunk];

  it('renders component for approve request', async () => {
    const state = getMockApproveConfirmState();

    console.log({ state });

    const mockStore = configureMockStore(middleware)(state);

    const { container } = renderWithConfirmContextProvider(
      <ApproveInfo />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });
});
