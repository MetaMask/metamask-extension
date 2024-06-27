import React from 'react';
import configureMockStore from 'redux-mock-store';
import { act } from '@testing-library/react';
import thunk from 'redux-thunk';
import { SEND_STAGES } from '../../ducks/send';
import {
  CONFIRMATION_V_NEXT_ROUTE,
  DEFAULT_ROUTE,
} from '../../helpers/constants/routes';
import { CHAIN_IDS, NETWORK_TYPES } from '../../../shared/constants/network';
import { renderWithProvider } from '../../../test/jest';
import mockSendState from '../../../test/data/mock-send-state.json';
import mockState from '../../../test/data/mock-state.json';
import { useIsOriginalNativeTokenSymbol } from '../../hooks/useIsOriginalNativeTokenSymbol';
import Routes from '.';

const middlewares = [thunk];

const mockShowNetworkDropdown = jest.fn();
const mockHideNetworkDropdown = jest.fn();

jest.mock('webextension-polyfill', () => ({
  runtime: {
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    getManifest: () => ({ manifest_version: 2 }),
  },
}));

jest.mock('../../store/actions', () => ({
  getGasFeeTimeEstimate: jest.fn().mockImplementation(() => Promise.resolve()),
  gasFeeStartPollingByNetworkClientId: jest
    .fn()
    .mockResolvedValue('pollingToken'),
  gasFeeStopPollingByPollingToken: jest.fn(),
  getNetworkConfigurationByNetworkClientId: jest
    .fn()
    .mockResolvedValue({ chainId: '0x5' }),
  showNetworkDropdown: () => mockShowNetworkDropdown,
  hideNetworkDropdown: () => mockHideNetworkDropdown,
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('../../ducks/send', () => ({
  ...jest.requireActual('../../ducks/send'),
  resetSendState: () => ({ type: 'XXX' }),
  getGasPrice: jest.fn(),
}));

jest.mock('../../ducks/domains', () => ({
  ...jest.requireActual('../../ducks/domains'),
  initializeDomainSlice: () => ({ type: 'XXX' }),
}));

jest.mock('../../hooks/useIsOriginalNativeTokenSymbol', () => {
  return {
    useIsOriginalNativeTokenSymbol: jest.fn(),
  };
});

jest.mock(
  '../../components/app/metamask-template-renderer/safe-component-list',
);

jest.mock('../../helpers/utils/feature-flags', () => ({
  ...jest.requireActual('../../helpers/utils/feature-flags'),
  getLocalNetworkMenuRedesignFeatureFlag: () => false,
}));

const render = async (route, state) => {
  const store = configureMockStore(middlewares)({
    ...mockSendState,
    ...state,
  });

  let result;

  await act(
    async () => (result = renderWithProvider(<Routes />, store, route)),
  );

  return result;
};

describe('Routes Component', () => {
  useIsOriginalNativeTokenSymbol.mockImplementation(() => true);

  afterEach(() => {
    mockShowNetworkDropdown.mockClear();
    mockHideNetworkDropdown.mockClear();
  });

  describe('render during send flow', () => {
    it('should render when send transaction is not active', async () => {
      const state = {
        ...mockSendState,
        metamask: {
          ...mockSendState.metamask,
          swapsState: {
            ...mockSendState.metamask.swapsState,
            swapsFeatureIsLive: true,
          },
          pendingApprovals: {},
          approvalFlows: [],
          announcements: {},
          providerConfig: {
            chainId: CHAIN_IDS.MAINNET,
            ticker: 'ETH',
            type: NETWORK_TYPES.MAINNET,
          },
          newPrivacyPolicyToastShownDate: new Date('0'),
        },
        send: {
          ...mockSendState.send,
          stage: SEND_STAGES.INACTIVE,
        },
        localeMessages: {
          currentLocale: 'en',
        },
      };
      const { getByTestId } = await render(undefined, state);
      expect(getByTestId('account-menu-icon')).not.toBeDisabled();
    });
  });
});

describe('toast display', () => {
  const getToastDisplayTestState = (date) => ({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      announcements: {},
      approvalFlows: [],
      completedOnboarding: true,
      usedNetworks: [],
      pendingApprovals: {},
      pendingApprovalCount: 0,
      swapsState: { swapsFeatureIsLive: true },
      newPrivacyPolicyToastShownDate: date,
    },
  });

  it('renders toastContainer on default route', async () => {
    await render([DEFAULT_ROUTE], getToastDisplayTestState(new Date('9999')));
    const toastContainer = document.querySelector('.toasts-container');
    expect(toastContainer).toBeInTheDocument();
  });

  it('does not render toastContainer on confirmation route', async () => {
    await render(
      [CONFIRMATION_V_NEXT_ROUTE],
      getToastDisplayTestState(new Date(0)),
    );
    const toastContainer = document.querySelector('.toasts-container');
    expect(toastContainer).not.toBeInTheDocument();
  });
});
