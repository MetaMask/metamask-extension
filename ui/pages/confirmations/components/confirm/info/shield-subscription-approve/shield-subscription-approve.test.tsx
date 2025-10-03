import React from 'react';
import configureMockStore from 'redux-mock-store';
import { getMockApproveConfirmState } from '../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../test/lib/confirmations/render-helpers';
import ShieldSubscriptionApproveInfo from './shield-subscription-approve';

jest.mock('../hooks/useDecodedTransactionData', () => ({
  useDecodedTransactionData: jest.fn(() => ({
    pending: false,
    value: {
      data: [
        {
          params: [{ name: 'value', value: '96000000000000000000' }],
        },
      ],
    },
  })),
}));

jest.mock('../../../../hooks/useAssetDetails', () => ({
  useAssetDetails: jest.fn(() => ({ decimals: 18 })),
}));

jest.mock('../../../../../../hooks/subscription/useSubscription', () => ({
  useUserSubscriptions: jest.fn(() => ({
    trialedProducts: [],
    loading: false,
  })),
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

describe('ShieldSubscriptionApproveInfo', () => {
  it('renders correctly', () => {
    const state = getMockApproveConfirmState();
    const mockStore = configureMockStore([])(state);
    const { container } = renderWithConfirmContextProvider(
      <ShieldSubscriptionApproveInfo />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });
});
