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
}));

jest.mock(
  '../../../../../../components/app/alert-system/contexts/alertMetricsContext',
  () => ({
    useAlertMetrics: jest.fn(() => ({
      trackAlertMetrics: jest.fn(),
    })),
  }),
);

jest.mock('./hooks/use-approve-token-simulation', () => ({
  useApproveTokenSimulation: jest.fn(() => ({
    spendingCap: '1000',
    formattedSpendingCap: '1000',
    value: '1000',
  })),
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

jest.mock('../hooks/useDecodedTransactionData', () => ({
  useDecodedTransactionData: jest.fn(() => ({
    value: {
      data: [
        {
          params: [
            {
              type: 'address',
              value: '0x2e0D7E8c45221FcA00d74a3609A0f7097035d09B',
            },
            {
              type: 'uint256',
              value: 1,
            },
          ],
        },
      ],
    },
    pending: false,
  })),
}));

describe('<ApproveInfo />', () => {
  const middleware = [thunk];

  it('renders component for approve request', async () => {
    const state = getMockApproveConfirmState();

    const mockStore = configureMockStore(middleware)(state);

    const { container } = renderWithConfirmContextProvider(
      <ApproveInfo />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });
});
