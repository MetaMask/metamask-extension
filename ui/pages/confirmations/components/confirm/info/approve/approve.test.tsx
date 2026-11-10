import { screen, waitFor } from '@testing-library/react';
import { ERC20 } from '@metamask/controller-utils';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { getMockConfirmStateForTransaction } from '../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../test/lib/confirmations/render-helpers';
import { useAssetDetails } from '../../../../hooks/useAssetDetails';
import {
  genUnapprovedApproveConfirmation,
  genUnapprovedPermit2ApproveConfirmation,
  PERMIT2_TOKEN_ADDRESS,
} from '../../../../../../../test/data/confirmations/token-approve';
import { enLocale as messages } from '../../../../../../../test/lib/i18n-helpers';
import {
  getTokenStandardAndDetailsByChain,
  TokenStandAndDetails,
} from '../../../../../../store/actions';
import ApproveInfo from './approve';
import { useApproveTokenSimulation } from './hooks/use-approve-token-simulation';
import { useIsNFT } from './hooks/use-is-nft';

jest.mock('../../../simulation-details/useBalanceChanges', () => ({
  useBalanceChanges: jest.fn(() => ({ pending: false, value: [] })),
}));

jest.mock('../../../../../../store/actions', () => ({
  ...jest.requireActual('../../../../../../store/actions'),
  getGasFeeTimeEstimate: jest.fn().mockResolvedValue({
    lowerTimeBound: 0,
    upperTimeBound: 60000,
  }),
  getTokenStandardAndDetailsByChain: jest.fn(),
}));

jest.mock('../../../../../../hooks/usePolling', () => jest.fn());

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
      expect(screen.getByText(messages.speed.message)).toBeInTheDocument();
    });

    expect(container).toMatchSnapshot();
  });

  describe('Permit2', () => {
    const mockedIsNFT = jest.mocked(useIsNFT);
    const mockedApproveTokenSimulation = jest.mocked(useApproveTokenSimulation);
    const defaultIsNFT = mockedIsNFT.getMockImplementation();
    const defaultApproveTokenSimulation =
      mockedApproveTokenSimulation.getMockImplementation();

    beforeEach(() => {
      mockedIsNFT.mockImplementation(
        jest.requireActual('./hooks/use-is-nft').useIsNFT,
      );
      mockedApproveTokenSimulation.mockImplementation(
        jest.requireActual('./hooks/use-approve-token-simulation')
          .useApproveTokenSimulation,
      );
      mockedAssetDetails.mockImplementation(
        jest.requireActual('../../../../hooks/useAssetDetails').useAssetDetails,
      );
      jest
        .mocked(getTokenStandardAndDetailsByChain)
        .mockImplementation(async (address) =>
          address === PERMIT2_TOKEN_ADDRESS
            ? { standard: ERC20, decimals: '6', symbol: 'USDC' }
            : ({} as TokenStandAndDetails),
        );
    });

    afterEach(() => {
      mockedIsNFT.mockImplementation(defaultIsNFT);
      mockedApproveTokenSimulation.mockImplementation(
        defaultApproveTokenSimulation,
      );
    });

    it('shows token, spender, amount and expiration with an empty simulation', async () => {
      const state = getMockConfirmStateForTransaction({
        ...genUnapprovedPermit2ApproveConfirmation(),
        simulationData: { tokenBalanceChanges: [] },
      });
      const mockStore = configureMockStore(middleware)(state);

      renderWithConfirmContextProvider(<ApproveInfo />, mockStore);

      await waitFor(() => {
        expect(screen.getByTestId('simulation-token-value')).toHaveTextContent(
          '1.5',
        );
      });
      expect(screen.getByTestId('edit-spending-cap-icon')).toBeInTheDocument();
      expect(screen.getByText('0x11111...11111')).toBeInTheDocument();
      expect(
        screen.getByTestId('confirmation__approve-spender'),
      ).toHaveTextContent('0x22222...22222');
      expect(
        screen.getByTestId('confirmation__approve-expiration'),
      ).toHaveTextContent('01 January 2026, 00:00');
    });
  });
});
