import { screen, waitFor } from '@testing-library/dom';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { getMockConfirmStateForTransaction } from '../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../test/lib/confirmations/render-helpers';
import { useAssetDetails } from '../../../../hooks/useAssetDetails';
import { genUnapprovedApproveConfirmation } from '../../../../../../../test/data/confirmations/token-approve';
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
    decimals: '18',
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
  const mockedAssetDetails = jest.mocked(useAssetDetails);

  beforeEach(() => {
    mockedAssetDetails.mockImplementation(() => ({
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      decimals: '4' as any,
    }));
  });

  it('renders component for approve request', async () => {
    const state = getMockConfirmStateForTransaction(
      genUnapprovedApproveConfirmation(),
    );

    const mockStore = configureMockStore(middleware)(state);

    const { container } = renderWithConfirmContextProvider(
      <ApproveInfo />,
      mockStore,
    );

    await waitFor(() => {
      expect(screen.getByText('Speed')).toBeInTheDocument();
    });

    expect(container).toMatchSnapshot();
  });
});
