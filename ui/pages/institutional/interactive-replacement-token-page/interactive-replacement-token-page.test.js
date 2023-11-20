import React from 'react';
import { screen, act, fireEvent, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import { SWAPS_CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP } from '../../../../shared/constants/swaps';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { shortenAddress } from '../../../helpers/utils/util';
import InteractiveReplacementTokenPage from '.';

const custodianAccounts = [
  {
    address: '0x9d0ba4ddac06032527b140912ec808ab9451b788',
    balance: '0x',
    name: 'Jupiter',
    envName: 'Jupiter',
    labels: [
      {
        key: 'service',
        value: 'Label test 1',
      },
    ],
  },
  {
    address: '0xeb9e64b93097bc15f01f13eae97015c57ab64823',
    balance: '0x',
    name: 'Jupiter',
    envName: 'Jupiter',
    labels: [
      {
        key: 'service',
        value: 'Label test 2',
      },
    ],
  },
];

const mockedShowInteractiveReplacementTokenBanner = jest.fn();

const mockedRemoveAddTokenConnectRequest = jest
  .fn()
  .mockReturnValue({ type: 'TYPE' });
const mockedSetCustodianNewRefreshToken = jest
  .fn()
  .mockReturnValue({ type: 'TYPE' });
let mockedGetCustodianConnectRequest = jest
  .fn()
  .mockReturnValue(async () => await custodianAccounts);

jest.mock('../../../store/institutional/institution-background', () => ({
  mmiActionsFactory: () => ({
    removeAddTokenConnectRequest: mockedRemoveAddTokenConnectRequest,
    setCustodianNewRefreshToken: mockedSetCustodianNewRefreshToken,
    getCustodianAccounts: mockedGetCustodianConnectRequest,
  }),
  showInteractiveReplacementTokenBanner: () =>
    mockedShowInteractiveReplacementTokenBanner,
}));

const address = '0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F';
const custodianAddress = '0xeb9e64b93097bc15f01f13eae97015c57ab64823';
const accountName = 'Jupiter';
const labels = [
  {
    key: 'service',
    value: 'label test',
  },
];
const connectRequests = [
  {
    labels,
    origin: 'origin',
    apiUrl: 'apiUrl',
  },
];

const props = {
  history: {
    push: jest.fn(),
  },
};

const render = ({ newState } = {}) => {
  const state = {
    ...mockState,
    metamask: {
      ...mockState.metamask,
      modal: { props: address },
      selectedAddress: address,
      interactiveReplacementToken: {
        url: 'https://saturn-custody-ui.codefi.network/',
      },
      custodyAccountDetails: {
        [address]: { balance: '0x', custodianName: 'Jupiter' },
      },
      mmiConfiguration: {
        custodians: [
          {
            production: true,
            name: 'Jupiter',
            envName: 'Jupiter',
            type: 'Jupiter',
            iconUrl: 'iconUrl',
            displayName: 'displayName',
          },
        ],
      },
      institutionalFeatures: {
        connectRequests,
      },
      ...newState,
    },
  };
  const middlewares = [thunk];
  const mockStore = configureMockStore(middlewares);
  const store = mockStore(state);

  return renderWithProvider(
    <InteractiveReplacementTokenPage {...props} />,
    store,
  );
};

describe('Interactive Replacement Token Page', function () {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render all the accounts correctly', async () => {
    const expectedHref = `${
      SWAPS_CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP[CHAIN_IDS.MAINNET]
    }address/${custodianAddress}`;

    await act(async () => await render());

    expect(screen.getByText(accountName)).toBeInTheDocument();
    const link = screen.getByRole('link', {
      name: shortenAddress(custodianAddress),
    });

    expect(link).toHaveAttribute('href', expectedHref);
    expect(
      screen.getByText(shortenAddress(custodianAddress)),
    ).toBeInTheDocument();
    expect(
      screen.getByText(custodianAccounts[1].labels[0].value),
    ).toBeInTheDocument();
  });

  it('should not render if connectRequests is empty', async () => {
    const newState = {
      institutionalFeatures: {
        connectRequests: [],
      },
    };

    const { queryByTestId } = render({ newState });

    expect(
      queryByTestId('interactive-replacement-token'),
    ).not.toBeInTheDocument();
  });

  it('should call onRemoveAddTokenConnectRequest and navigate to mostRecentOverviewPage when handleReject is called', () => {
    const { getByText } = render();

    fireEvent.click(getByText('Reject'));

    expect(mockedRemoveAddTokenConnectRequest).toHaveBeenCalled();
    expect(mockedRemoveAddTokenConnectRequest).toHaveBeenCalledWith({
      origin: connectRequests[0].origin,
      apiUrl: connectRequests[0].apiUrl,
      token: connectRequests[0].token,
    });
  });

  it('should call onRemoveAddTokenConnectRequest, setCustodianNewRefreshToken, and dispatch showInteractiveReplacementTokenBanner when handleApprove is called', async () => {
    const mostRecentOverviewPage = {
      pathname: '/institutional-features/done',
      state: {
        description:
          'You can now use your custodian accounts in MetaMask Institutional.',
        imgSrc: 'iconUrl',
        title: 'Your custodian token has been refreshed',
      },
    };

    await act(async () => {
      const { getByText } = await render();
      fireEvent.click(getByText('Approve'));
    });

    expect(mockedShowInteractiveReplacementTokenBanner).toHaveBeenCalled();
    expect(mockedRemoveAddTokenConnectRequest).toHaveBeenCalled();
    expect(mockedRemoveAddTokenConnectRequest).toHaveBeenCalledWith({
      origin: connectRequests[0].origin,
      apiUrl: connectRequests[0].apiUrl,
      token: connectRequests[0].token,
    });
    expect(props.history.push).toHaveBeenCalled();
    expect(props.history.push).toHaveBeenCalledWith(mostRecentOverviewPage);
  });

  it('should reject if there are errors', async () => {
    mockedGetCustodianConnectRequest = jest.fn().mockReturnValue(async () => {
      throw new Error();
    });

    await act(async () => {
      const { getByText, container } = await render();
      fireEvent.click(getByText('Approve'));
      await waitFor(() => {
        expect(container).toMatchSnapshot();
      });
    });
  });
});
