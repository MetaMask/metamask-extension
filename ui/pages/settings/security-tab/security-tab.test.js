import { fireEvent, queryByRole, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { MetamaskNotificationsProvider } from '../../../contexts/metamask-notifications';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_POPUP } from '../../../../shared/constants/app';
import mockState from '../../../../test/data/mock-state.json';
import { tEn } from '../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { getIsSecurityAlertsEnabled } from '../../../selectors';
import { REVEAL_SRP_LIST_ROUTE } from '../../../helpers/constants/routes';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import SecurityTab from './security-tab.container';

const mockOpenDeleteMetaMetricsDataModal = jest.fn();

const mockSetSecurityAlertsEnabled = jest
  .fn()
  .mockImplementation(() => () => undefined);

jest.mock('../../../../app/scripts/lib/util', () => {
  const originalModule = jest.requireActual('../../../../app/scripts/lib/util');

  return {
    ...originalModule,
    getEnvironmentType: jest.fn(),
  };
});

jest.mock('../../../selectors', () => ({
  ...jest.requireActual('../../../selectors'),
  getIsSecurityAlertsEnabled: jest.fn(),
}));

jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  setSecurityAlertsEnabled: (val) => mockSetSecurityAlertsEnabled(val),
}));

jest.mock('../../../ducks/app/app.ts', () => {
  return {
    openDeleteMetaMetricsDataModal: () => {
      return mockOpenDeleteMetaMetricsDataModal;
    },
  };
});

const mockHistoryPush = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  // eslint-disable-next-line react/display-name
  withRouter: (Component) => (props) => (
    <Component
      {...props}
      {...{
        history: {
          push: mockHistoryPush,
        },
      }}
    />
  ),
}));

describe('Security Tab', () => {
  const mockStore = configureMockStore([thunk])(mockState);

  function renderWithProviders(ui, store) {
    return renderWithProvider(
      <MetamaskNotificationsProvider>{ui}</MetamaskNotificationsProvider>,
      store,
    );
  }

  function toggleCheckbox(testId, initialState, skipRender = false) {
    if (!skipRender) {
      renderWithProviders(<SecurityTab />, mockStore);
    }

    const container = screen.getByTestId(testId);
    const checkbox = queryByRole(container, 'checkbox');

    expect(checkbox).toHaveAttribute('value', initialState ? 'true' : 'false');

    fireEvent.click(checkbox); // This fires the onToggle method of the ToggleButton, but it doesn't change the value of the checkbox

    fireEvent.change(checkbox, {
      target: { value: !initialState }, // This changes the value of the checkbox
    });

    expect(checkbox).toHaveAttribute('value', initialState ? 'false' : 'true');

    return true;
  }

  it('should match snapshot', () => {
    const { container } = renderWithProviders(<SecurityTab />, mockStore);

    expect(container).toMatchSnapshot();
  });

  it('should render success banner when SRP is backed up', () => {
    const { getByTestId } = renderWithProviders(<SecurityTab />, mockStore);
    const bannerAlert = getByTestId('backup-state-banner-alert');
    expect(bannerAlert).toBeInTheDocument();
    expect(bannerAlert).toHaveClass('mm-banner-alert--severity-success');
  });

  it('should render danger banner when SRP is not backed up', () => {
    const { getByTestId } = renderWithProviders(
      <SecurityTab />,
      configureMockStore([thunk])({
        ...mockState,
        metamask: {
          ...mockState.metamask,
          seedPhraseBackedUp: false,
          firstTimeFlowType: FirstTimeFlowType.create,
        },
      }),
    );
    const bannerAlert = getByTestId('backup-state-banner-alert');
    expect(bannerAlert).toBeInTheDocument();
    expect(bannerAlert).toHaveClass('mm-banner-alert--severity-danger');
  });

  it('toggles Display NFT media enabled', async () => {
    expect(await toggleCheckbox('displayNftMedia', true)).toBe(true);
  });

  it('toggles nft detection', async () => {
    expect(await toggleCheckbox('useNftDetection', true)).toBe(true);
  });

  it('toggles nft detection from another initial state', async () => {
    mockState.metamask.openSeaEnabled = false;
    mockState.metamask.useNftDetection = false;

    const localMockStore = configureMockStore([thunk])(mockState);
    renderWithProviders(<SecurityTab />, localMockStore);

    expect(await toggleCheckbox('useNftDetection', false, true)).toBe(true);
  });

  it('toggles phishing detection', async () => {
    expect(await toggleCheckbox('usePhishingDetection', true)).toBe(true);
  });

  it('toggles 4byte resolution', async () => {
    expect(await toggleCheckbox('4byte-resolution-container', true)).toBe(true);
  });

  it('toggles balance and token price checker', async () => {
    expect(await toggleCheckbox('currencyRateCheckToggle', true)).toBe(true);
  });

  it('should toggle token detection', async () => {
    expect(await toggleCheckbox('autoDetectTokens', true)).toBe(true);
  });

  it('toggles batch balance checks', async () => {
    expect(await toggleCheckbox('useMultiAccountBalanceChecker', false)).toBe(
      true,
    );
  });

  it('toggles network details validation', async () => {
    expect(await toggleCheckbox('useSafeChainsListValidation', false)).toBe(
      true,
    );
  });

  it('toggles metaMetrics', async () => {
    expect(
      await toggleCheckbox('participate-in-meta-metrics-toggle', false),
    ).toBe(true);
  });

  it('redirects to srp list upon clicking "Reveal Secret Recovery Phrase"', async () => {
    const mockStoreWithMultipleSRPs = configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        keyrings: [
          ...mockState.metamask.keyrings,
          {
            type: 'HD Key Tree',
            accounts: ['0x'],
            metadata: {
              id: '01JM1XSBQ78YXY1NNT003HT74V',
              name: '',
            },
          },
        ],
      },
    });
    renderWithProviders(<SecurityTab />, mockStoreWithMultipleSRPs);

    expect(
      screen.queryByTestId(`srp_stage_introduction`),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('reveal-seed-words'));

    expect(mockHistoryPush).toHaveBeenCalledWith({
      pathname: REVEAL_SRP_LIST_ROUTE,
    });
  });

  it('sets IPFS gateway', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SecurityTab />, mockStore);

    const ipfsField = screen.getByDisplayValue(mockState.metamask.ipfsGateway);

    await user.click(ipfsField);

    await userEvent.clear(ipfsField);

    expect(ipfsField).toHaveValue('');
    expect(screen.queryByText(tEn('invalidIpfsGateway'))).toBeInTheDocument();
    expect(
      screen.queryByText(tEn('forbiddenIpfsGateway')),
    ).not.toBeInTheDocument();

    await userEvent.type(ipfsField, 'https://');

    expect(ipfsField).toHaveValue('https://');
    expect(screen.queryByText(tEn('invalidIpfsGateway'))).toBeInTheDocument();
    expect(
      screen.queryByText(tEn('forbiddenIpfsGateway')),
    ).not.toBeInTheDocument();

    await userEvent.type(ipfsField, '//');

    expect(ipfsField).toHaveValue('https:////');
    expect(screen.queryByText(tEn('invalidIpfsGateway'))).toBeInTheDocument();
    expect(
      screen.queryByText(tEn('forbiddenIpfsGateway')),
    ).not.toBeInTheDocument();

    await userEvent.clear(ipfsField);

    await userEvent.type(ipfsField, 'gateway.ipfs.io');

    expect(ipfsField).toHaveValue('gateway.ipfs.io');
    expect(
      screen.queryByText(tEn('invalidIpfsGateway')),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(tEn('forbiddenIpfsGateway'))).toBeInTheDocument();
  });

  it('toggles IPFS gateway', async () => {
    mockState.metamask.ipfsGateway = '';

    const localMockStore = configureMockStore([thunk])(mockState);
    renderWithProviders(<SecurityTab />, localMockStore);

    expect(await toggleCheckbox('ipfsToggle', false, true)).toBe(true);
    expect(await toggleCheckbox('ipfsToggle', true, true)).toBe(true);
  });

  it('toggles ENS domains in address bar', async () => {
    expect(
      await toggleCheckbox('ipfs-gateway-resolution-container', false),
    ).toBe(true);
  });

  it('toggles skipDeepLinkInterstitial', async () => {
    expect(toggleCheckbox('skipDeepLinkInterstitial', false)).toBe(true);
  });

  it('clicks "Add Custom Network"', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SecurityTab />, mockStore);

    // Test the default path where `getEnvironmentType() === undefined`
    await user.click(screen.getByText(tEn('addCustomNetwork')));

    // Now force it down the path where `getEnvironmentType() === ENVIRONMENT_TYPE_POPUP`
    jest
      .mocked(getEnvironmentType)
      .mockImplementationOnce(() => ENVIRONMENT_TYPE_POPUP);

    global.platform = { openExtensionInBrowser: jest.fn() };

    await user.click(screen.getByText(tEn('addCustomNetwork')));
    expect(global.platform.openExtensionInBrowser).toHaveBeenCalled();
  });
  it('clicks "Delete MetaMetrics Data"', async () => {
    mockState.metamask.participateInMetaMetrics = true;
    mockState.metamask.metaMetricsId = 'fake-metametrics-id';

    const localMockStore = configureMockStore([thunk])(mockState);
    renderWithProviders(<SecurityTab />, localMockStore);

    expect(
      screen.queryByTestId(`delete-metametrics-data-button`),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Delete MetaMetrics data' }),
    );

    expect(mockOpenDeleteMetaMetricsDataModal).toHaveBeenCalled();
  });
  describe('Blockaid', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('invokes method setSecurityAlertsEnabled when blockaid is enabled', async () => {
      getIsSecurityAlertsEnabled.mockReturnValue(false);
      expect(await toggleCheckbox('securityAlert', false)).toBe(true);
      expect(mockSetSecurityAlertsEnabled).toHaveBeenCalledWith(true);
    });
  });
});
