import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { setBackgroundConnection } from '../../../store/background-connection';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { SHOW_BASIC_FUNCTIONALITY_MODAL_OPEN } from '../../../store/actionConstants';
import { mockNetworkState } from '../../../../test/stub/networks';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import PrivacySettings from './privacy-settings';

const mockGetIsBasicFunctionalityConsolidationEnabledInBuild = jest.fn(
  () => false,
);

jest.mock('../../../../shared/lib/environment', () => ({
  ...jest.requireActual('../../../../shared/lib/environment'),
  getIsBasicFunctionalityConsolidationEnabledInBuild: () =>
    mockGetIsBasicFunctionalityConsolidationEnabledInBuild(),
}));

jest.mock('../../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../../shared/lib/analytics/create-event-builder',
  );

  return {
    useAnalytics: () => ({
      trackEvent: jest.fn(),
      createEventBuilder,
    }),
  };
});

const mockOpenBasicFunctionalityModal = jest.fn().mockImplementation(() => {
  return {
    type: SHOW_BASIC_FUNCTIONALITY_MODAL_OPEN,
  };
});

jest.mock('../../../ducks/app/app.ts', () => {
  return {
    openBasicFunctionalityModal: () => {
      return mockOpenBasicFunctionalityModal();
    },
  };
});

const mockTrackEvent = jest.fn();

jest.mock('../../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../../shared/lib/analytics/create-event-builder',
  );

  return {
    useAnalytics: () => ({
      trackEvent: mockTrackEvent,
      createEventBuilder,
    }),
  };
});

describe('Privacy Settings Onboarding View', () => {
  const mockStore = {
    metamask: {
      ...mockNetworkState(
        { chainId: CHAIN_IDS.MAINNET },
        { chainId: CHAIN_IDS.LINEA_MAINNET },
        { chainId: CHAIN_IDS.SEPOLIA },
        { chainId: CHAIN_IDS.LINEA_SEPOLIA },
      ),
      use4ByteResolution: true,
      useTokenDetection: false,
      useCurrencyRateCheck: true,
      useMultiAccountBalanceChecker: true,
      ipfsGateway: 'test.link',
      useAddressBarEnsResolution: true,
      useTransactionSimulations: true,
      useExternalServices: true,
    },
    appState: {
      externalServicesOnboardingToggleState: true,
    },
  };

  const store = configureMockStore([thunk])(mockStore);
  const setFeatureFlagStub = jest.fn();
  const setUse4ByteResolutionStub = jest.fn();
  const setUseTokenDetectionStub = jest.fn().mockResolvedValue(true);
  const setUseCurrencyRateCheckStub = jest.fn().mockResolvedValue(true);
  const setIpfsGatewayStub = jest.fn().mockResolvedValue('test.link');
  const completeOnboardingStub = jest.fn().mockResolvedValue(true);
  const setUseMultiAccountBalanceCheckerStub = jest
    .fn()
    .mockResolvedValue(true);
  const setUseAddressBarEnsResolutionStub = jest.fn().mockResolvedValue(true);
  const onboardingToggleBasicFunctionalityOnStub = jest.fn();
  const toggleExternalServicesStub = jest.fn();
  const setUseTransactionSimulationsStub = jest.fn();
  const setPreferenceStub = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetIsBasicFunctionalityConsolidationEnabledInBuild.mockReturnValue(
      false,
    );
  });

  setBackgroundConnection({
    setFeatureFlag: setFeatureFlagStub,
    setUse4ByteResolution: setUse4ByteResolutionStub,
    setUseTokenDetection: setUseTokenDetectionStub,
    setUseCurrencyRateCheck: setUseCurrencyRateCheckStub,
    setIpfsGateway: setIpfsGatewayStub,
    completeOnboarding: completeOnboardingStub,
    setUseMultiAccountBalanceChecker: setUseMultiAccountBalanceCheckerStub,
    setUseAddressBarEnsResolution: setUseAddressBarEnsResolutionStub,
    toggleExternalServices: toggleExternalServicesStub,
    onboardingToggleBasicFunctionalityOn:
      onboardingToggleBasicFunctionalityOnStub,
    setUseTransactionSimulations: setUseTransactionSimulationsStub,
    setPreference: setPreferenceStub,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

  it('should update the default settings from each category', () => {
    const { container, queryByTestId } = renderWithProvider(
      <PrivacySettings />,
      store,
    );
    // All settings are initialized toggled to be same as default
    expect(toggleExternalServicesStub).toHaveBeenCalledTimes(0);
    expect(setUse4ByteResolutionStub).toHaveBeenCalledTimes(0);
    expect(setUseTokenDetectionStub).toHaveBeenCalledTimes(0);
    expect(setUseMultiAccountBalanceCheckerStub).toHaveBeenCalledTimes(0);
    expect(setUseCurrencyRateCheckStub).toHaveBeenCalledTimes(0);
    expect(setUseAddressBarEnsResolutionStub).toHaveBeenCalledTimes(0);
    expect(setUseTransactionSimulationsStub).toHaveBeenCalledTimes(0);
    expect(setPreferenceStub).toHaveBeenCalledTimes(0);

    // Default Settings - Privacy category
    const itemCategoryPrivacy = queryByTestId('category-item-Privacy');
    expect(itemCategoryPrivacy).toBeInTheDocument();
    fireEvent.click(itemCategoryPrivacy as HTMLElement);

    const toggles = container.querySelectorAll('input[type=checkbox]');
    const backButton = queryByTestId('privacy-settings-back-button');

    fireEvent.click(toggles[0]); // toggleExternalServicesStub
    fireEvent.click(toggles[1]); // setUseTokenDetectionStub
    fireEvent.click(toggles[2]); // setUseTransactionSimulationsStub
    fireEvent.click(toggles[3]); // setUseCurrencyRateCheckStub
    fireEvent.click(toggles[4]); // setUseAddressBarEnsResolutionStub
    fireEvent.click(toggles[5]); // setUseMultiAccountBalanceCheckerStub
    fireEvent.click(toggles[6]); // setUse4ByteResolutionStub
    fireEvent.click(toggles[7]); // setPreferenceStub

    fireEvent.click(backButton as HTMLElement);

    expect(setUseTokenDetectionStub).toHaveBeenCalledTimes(1);
    expect(setUseTokenDetectionStub.mock.calls[0][0]).toStrictEqual(true);
    expect(setUseTransactionSimulationsStub).toHaveBeenCalledTimes(1);
    expect(setUseTransactionSimulationsStub.mock.calls[0][0]).toStrictEqual(
      false,
    );

    expect(setUseCurrencyRateCheckStub).toHaveBeenCalledTimes(1);
    expect(setUseCurrencyRateCheckStub.mock.calls[0][0]).toStrictEqual(false);
    expect(setUseAddressBarEnsResolutionStub).toHaveBeenCalledTimes(1);
    expect(setUseAddressBarEnsResolutionStub.mock.calls[0][0]).toStrictEqual(
      false,
    );
    expect(setUseMultiAccountBalanceCheckerStub).toHaveBeenCalledTimes(1);
    expect(setUseMultiAccountBalanceCheckerStub.mock.calls[0][0]).toStrictEqual(
      false,
    );

    expect(setUse4ByteResolutionStub).toHaveBeenCalledTimes(1);
    expect(setUse4ByteResolutionStub.mock.calls[0][0]).toStrictEqual(false);
  });

  describe('when Basic Functionality consolidation is enabled', () => {
    beforeEach(() => {
      mockGetIsBasicFunctionalityConsolidationEnabledInBuild.mockReturnValue(
        true,
      );
    });

    it('hides BFT child toggles and does not persist them on submit', () => {
      const { container, queryByTestId, queryByText } = renderWithProvider(
        <PrivacySettings />,
        store,
      );

      expect(queryByTestId('category-item-Privacy')).toBeInTheDocument();
      expect(
        queryByTestId('category-item-Backup and sync'),
      ).toBeInTheDocument();
      expect(queryByTestId('category-item-Networks')).toBeInTheDocument();
      expect(queryByTestId('category-item-General')).not.toBeInTheDocument();
      expect(queryByTestId('category-item-Assets')).not.toBeInTheDocument();
      expect(queryByTestId('category-item-Security')).not.toBeInTheDocument();

      fireEvent.click(queryByTestId('category-item-Privacy') as HTMLElement);

      expect(queryByText(messages.turnOnTokenDetection.message)).toBeNull();
      expect(
        queryByText(messages.simulationsSettingSubHeader.message),
      ).toBeNull();
      expect(queryByText(messages.currencyRateCheckToggle.message)).toBeNull();
      expect(queryByText(messages.ensDomainsSettingTitle.message)).toBeNull();
      expect(
        queryByText(messages.useMultiAccountBalanceChecker.message),
      ).toBeNull();
      expect(queryByTestId('ipfs-input')).toBeInTheDocument();
      expect(container.querySelectorAll('input[type=checkbox]')).toHaveLength(
        1,
      );

      fireEvent.click(
        queryByTestId('privacy-settings-back-button') as HTMLElement,
      );

      expect(setUseTokenDetectionStub).not.toHaveBeenCalled();
      expect(setUseTransactionSimulationsStub).not.toHaveBeenCalled();
      expect(setUseCurrencyRateCheckStub).not.toHaveBeenCalled();
      expect(setUseAddressBarEnsResolutionStub).not.toHaveBeenCalled();
      expect(setUseMultiAccountBalanceCheckerStub).not.toHaveBeenCalled();
      expect(setUse4ByteResolutionStub).not.toHaveBeenCalled();
    });

    it('locks the Basic Functionality toggle on for social login', () => {
      const socialLoginStore = configureMockStore([thunk])({
        ...mockStore,
        metamask: {
          ...mockStore.metamask,
          firstTimeFlowType: FirstTimeFlowType.socialCreate,
        },
      });
      const { getByTestId } = renderWithProvider(
        <PrivacySettings />,
        socialLoginStore,
      );

      fireEvent.click(getByTestId('category-item-Privacy'));
      const setting = getByTestId('basic-functionality-toggle');
      const toggle = setting.querySelector('input[type=checkbox]');

      expect(toggle).toHaveAttribute('value', 'true');
      expect(setting.querySelector('.toggle-button--disabled')).not.toBeNull();

      fireEvent.click(toggle as HTMLElement);

      expect(mockOpenBasicFunctionalityModal).not.toHaveBeenCalled();
    });

    it('lets secret recovery phrase users change the Basic Functionality toggle', () => {
      const { getByTestId } = renderWithProvider(<PrivacySettings />, store);

      fireEvent.click(getByTestId('category-item-Privacy'));
      const setting = getByTestId('basic-functionality-toggle');

      expect(setting.querySelector('.toggle-button--disabled')).toBeNull();
    });

    it('shows social-login MetaMetrics settings in the Privacy category', () => {
      const updatedMockStore = configureMockStore([thunk])({
        ...mockStore,
        metamask: {
          ...mockStore.metamask,
          firstTimeFlowType: FirstTimeFlowType.socialCreate,
        },
      });
      const { queryByTestId, queryByText } = renderWithProvider(
        <PrivacySettings />,
        updatedMockStore,
      );

      fireEvent.click(queryByTestId('category-item-Privacy') as HTMLElement);

      expect(
        queryByText(messages.participateInMetaMetrics.message),
      ).toBeInTheDocument();
      expect(
        queryByTestId('delete-metametrics-data-button'),
      ).not.toBeInTheDocument();
      expect(queryByTestId('category-item-Security')).not.toBeInTheDocument();
    });
  });

  it('renders network rows as keyboard-operable buttons named for each network', () => {
    const { getByRole, queryByRole } = renderWithProvider(
      <PrivacySettings />,
      store,
    );

    fireEvent.click(getByRole('button', { name: messages.networks.message }));

    expect(
      getByRole('button', { name: messages.networkNameEthereum.message }),
    ).toHaveAttribute('type', 'button');
    expect(
      getByRole('button', { name: messages.lineaMainnet.message }),
    ).toHaveAttribute('type', 'button');
    expect(
      queryByRole('button', { name: messages.next.message }),
    ).not.toBeInTheDocument();
    expect(queryByRole('button', { name: 'Sepolia' })).not.toBeInTheDocument();
  });

  it('renders category rows as keyboard-operable buttons', () => {
    const { getByRole } = renderWithProvider(<PrivacySettings />, store);

    expect(
      getByRole('button', { name: messages.privacy.message }),
    ).toBeInTheDocument();
    expect(
      getByRole('button', { name: messages.backupAndSync.message }),
    ).toBeInTheDocument();
    expect(
      getByRole('button', { name: messages.networks.message }),
    ).toBeInTheDocument();
  });

  it('groups settings into Privacy, Backup and sync, and Networks', () => {
    mockGetIsBasicFunctionalityConsolidationEnabledInBuild.mockReturnValue(
      true,
    );
    const { getByTestId, getByText } = renderWithProvider(
      <PrivacySettings />,
      store,
    );

    fireEvent.click(getByTestId('category-item-Privacy'));
    expect(
      getByText(messages.basicConfigurationLabel.message),
    ).toBeInTheDocument();
    expect(
      getByText(messages.onboardingAdvancedPrivacyIPFSTitle.message),
    ).toBeInTheDocument();

    fireEvent.click(getByTestId('category-back-button'));
    fireEvent.click(getByTestId('category-item-Backup and sync'));
    expect(getByText(messages.backupAndSyncEnable.message)).toBeInTheDocument();

    fireEvent.click(getByTestId('category-back-button'));
    fireEvent.click(getByTestId('category-item-Networks'));
    expect(
      getByText(messages.onboardingAdvancedPrivacyNetworkTitle.message),
    ).toBeInTheDocument();
  });

  describe('Social Login Flow', () => {
    it('should update the default settings for social login', async () => {
      const updatedMockStore = configureMockStore([thunk])({
        ...mockStore,
        metamask: {
          ...mockStore.metamask,
          firstTimeFlowType: FirstTimeFlowType.socialCreate,
        },
      });
      const { getByText } = renderWithProvider(
        <PrivacySettings />,
        updatedMockStore,
      );

      expect(getByText(messages.privacy.message)).toBeInTheDocument();
    });
  });

  describe('IPFS', () => {
    it('accepts a valid IPFS input without showing a validation message', () => {
      const { queryByTestId, queryByText } = renderWithProvider(
        <PrivacySettings />,
        store,
      );

      const itemCategoryPrivacy = queryByTestId('category-item-Privacy');
      fireEvent.click(itemCategoryPrivacy as HTMLElement);

      const ipfsInput = queryByTestId('ipfs-input');
      const ipfsEvent = {
        target: {
          value: 'ipfs.io',
        },
      };

      fireEvent.change(ipfsInput as HTMLElement, ipfsEvent);

      expect(
        queryByText(messages.onboardingAdvancedPrivacyIPFSInvalid.message),
      ).not.toBeInTheDocument();

      const backButton = queryByTestId('privacy-settings-back-button');
      fireEvent.click(backButton as HTMLElement);

      expect(setIpfsGatewayStub).toHaveBeenCalled();
    });

    it('should error with gateway.ipfs.io IPFS input', () => {
      const { queryByTestId, queryByText } = renderWithProvider(
        <PrivacySettings />,
        store,
      );

      const itemCategoryPrivacy = queryByTestId('category-item-Privacy');
      fireEvent.click(itemCategoryPrivacy as HTMLElement);

      const ipfsInput = queryByTestId('ipfs-input');
      const ipfsEvent = {
        target: {
          value: 'gateway.ipfs.io',
        },
      };

      fireEvent.change(ipfsInput as HTMLElement, ipfsEvent);

      const invalidErrorMsg = queryByText(
        messages.onboardingAdvancedPrivacyIPFSInvalid.message,
      );

      expect(invalidErrorMsg).toBeInTheDocument();
      expect(invalidErrorMsg).toHaveAttribute(
        'id',
        'onboarding-ipfs-gateway-error',
      );
      expect(ipfsInput).toHaveAttribute('aria-invalid', 'true');
      expect(ipfsInput).toHaveAttribute(
        'aria-describedby',
        'onboarding-ipfs-gateway-error',
      );
    });

    it('should error with ipfs.infura.io IPFS input', () => {
      const { queryByTestId, queryByText } = renderWithProvider(
        <PrivacySettings />,
        store,
      );

      const itemCategoryPrivacy = queryByTestId('category-item-Privacy');
      fireEvent.click(itemCategoryPrivacy as HTMLElement);

      const ipfsInput = queryByTestId('ipfs-input');
      const ipfsEvent = {
        target: {
          value: 'ipfs.infura.io',
        },
      };

      fireEvent.change(ipfsInput as HTMLElement, ipfsEvent);

      const invalidErrorMsg = queryByText(
        messages.onboardingAdvancedPrivacyIPFSInvalid.message,
      );

      expect(invalidErrorMsg).toBeInTheDocument();
    });

    it('should error with improper IPFS input', () => {
      const { queryByTestId, queryByText } = renderWithProvider(
        <PrivacySettings />,
        store,
      );

      const itemCategoryPrivacy = queryByTestId('category-item-Privacy');
      fireEvent.click(itemCategoryPrivacy as HTMLElement);

      const ipfsInput = queryByTestId('ipfs-input');
      const ipfsEvent = {
        target: {
          value: ' ',
        },
      };

      fireEvent.change(ipfsInput as HTMLElement, ipfsEvent);

      const invalidErrorMsg = queryByText(
        messages.onboardingAdvancedPrivacyIPFSInvalid.message,
      );

      expect(invalidErrorMsg).toBeInTheDocument();
    });
  });
});
