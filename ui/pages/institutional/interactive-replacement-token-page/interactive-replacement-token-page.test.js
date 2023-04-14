import React from 'react';
import { screen, act } from '@testing-library/react';
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
    labels: [
      {
        key: 'service',
        value: 'test',
      },
    ],
  },
  {
    address: '0xeb9e64b93097bc15f01f13eae97015c57ab64823',
    balance: '0x',
    name: 'Jupiter',
    labels: [
      {
        key: 'service',
        value: 'test',
      },
    ],
  },
];

const mockedRemoveAddTokenConnectRequest = jest
  .fn()
  .mockReturnValue({ type: 'TYPE' });
const mockedSetCustodianNewRefreshToken = jest
  .fn()
  .mockReturnValue({ type: 'TYPE' });
const mockedGetCustodianConnectRequest = jest
  .fn()
  .mockReturnValue(async () => custodianAccounts);

jest.mock('../../../store/institutional/institution-background', () => ({
  mmiActionsFactory: () => ({
    removeAddTokenConnectRequest: mockedRemoveAddTokenConnectRequest,
    setCustodianNewRefreshToken: mockedSetCustodianNewRefreshToken,
    getCustodianAccounts: mockedGetCustodianConnectRequest,
  }),
  showInteractiveReplacementTokenBanner: jest
    .fn()
    .mockReturnValue({ type: 'TYPE' }),
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
    token: {
      projectName: 'projectName',
      projectId: 'projectId',
      clientId: 'clientId',
    },
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
            type: 'Jupiter',
            iconUrl: 'iconUrl',
            displayName: 'displayName',
          },
        ],
      },
      institutionalFeatures: {
        complianceProjectId: '',
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
    // expect(screen.getByText(labels[0].value)).toBeInTheDocument(); Add later
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
});
