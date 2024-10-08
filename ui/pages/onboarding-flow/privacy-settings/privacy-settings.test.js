import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { setBackgroundConnection } from '../../../store/background-connection';
import { renderWithProvider } from '../../../../test/jest';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { SHOW_BASIC_FUNCTIONALITY_MODAL_OPEN } from '../../../store/actionConstants';
import { mockNetworkState } from '../../../../test/stub/networks';
import PrivacySettings from './privacy-settings';

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

describe('Privacy Settings Onboarding View', () => {
  const mockStore = {
    metamask: {
      ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),

      preferences: {
        petnamesEnabled: true,
      },
      incomingTransactionsPreferences: {
        [CHAIN_IDS.MAINNET]: true,
        [CHAIN_IDS.LINEA_MAINNET]: false,
        [CHAIN_IDS.SEPOLIA]: false,
        [CHAIN_IDS.LINEA_GOERLI]: true,
        [CHAIN_IDS.LINEA_SEPOLIA]: true,
      },
      usePhishDetect: true,
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
  const setUsePhishDetectStub = jest.fn();
  const setUse4ByteResolutionStub = jest.fn();
  const setUseTokenDetectionStub = jest.fn();
  const setUseCurrencyRateCheckStub = jest.fn();
  const setIpfsGatewayStub = jest.fn();
  const completeOnboardingStub = jest
    .fn()
    .mockImplementation(() => Promise.resolve());
  const setUseMultiAccountBalanceCheckerStub = jest.fn();
  const setUseAddressBarEnsResolutionStub = jest.fn();
  const setIncomingTransactionsPreferencesStub = jest.fn();
  const onboardingToggleBasicFunctionalityOnStub = jest.fn();
  const toggleExternalServicesStub = jest.fn();
  const setUseTransactionSimulationsStub = jest.fn();
  const setPreferenceStub = jest.fn();
  const enableProfileSyncingStub = jest.fn();
  const disableProfileSyncingStub = jest.fn();

  setBackgroundConnection({
    setFeatureFlag: setFeatureFlagStub,
    setUsePhishDetect: setUsePhishDetectStub,
    setUse4ByteResolution: setUse4ByteResolutionStub,
    setUseTokenDetection: setUseTokenDetectionStub,
    setUseCurrencyRateCheck: setUseCurrencyRateCheckStub,
    setIpfsGateway: setIpfsGatewayStub,
    completeOnboarding: completeOnboardingStub,
    setUseMultiAccountBalanceChecker: setUseMultiAccountBalanceCheckerStub,
    setUseAddressBarEnsResolution: setUseAddressBarEnsResolutionStub,
    setIncomingTransactionsPreferences: setIncomingTransactionsPreferencesStub,
    toggleExternalServices: toggleExternalServicesStub,
    onboardingToggleBasicFunctionalityOn:
      onboardingToggleBasicFunctionalityOnStub,
    setUseTransactionSimulations: setUseTransactionSimulationsStub,
    setPreference: setPreferenceStub,
    enableProfileSyncing: enableProfileSyncingStub,
    disableProfileSyncing: disableProfileSyncingStub,
  });

  it('should update preferences', () => {
    const { container, getByText } = renderWithProvider(
      <PrivacySettings />,
      store,
    );
    // All settings are initialized toggled to be same as default
    expect(toggleExternalServicesStub).toHaveBeenCalledTimes(0);
    expect(setUsePhishDetectStub).toHaveBeenCalledTimes(0);
    expect(setUse4ByteResolutionStub).toHaveBeenCalledTimes(0);
    expect(setUseTokenDetectionStub).toHaveBeenCalledTimes(0);
    expect(setUseMultiAccountBalanceCheckerStub).toHaveBeenCalledTimes(0);
    expect(setUseCurrencyRateCheckStub).toHaveBeenCalledTimes(0);
    expect(setUseAddressBarEnsResolutionStub).toHaveBeenCalledTimes(0);
    expect(setIncomingTransactionsPreferencesStub).toHaveBeenCalledTimes(0);
    expect(setUseTransactionSimulationsStub).toHaveBeenCalledTimes(0);
    expect(setPreferenceStub).toHaveBeenCalledTimes(0);

    const toggles = container.querySelectorAll('input[type=checkbox]');
    const submitButton = getByText('Done');
    // TODO: refactor this toggle array, not very readable
    // toggle to false

    fireEvent.click(toggles[0]); // toggleExternalServicesStub
    fireEvent.click(toggles[1]); // setIncomingTransactionsPreferencesStub
    fireEvent.click(toggles[2]); // setIncomingTransactionsPreferencesStub (2)
    fireEvent.click(toggles[3]); // setIncomingTransactionsPreferencesStub (3)
    fireEvent.click(toggles[4]); // setIncomingTransactionsPreferencesStub (4)
    fireEvent.click(toggles[5]); // setUsePhishDetectStub
    fireEvent.click(toggles[6]);
    fireEvent.click(toggles[7]); // setUse4ByteResolutionStub
    fireEvent.click(toggles[8]); // setUseTokenDetectionStub
    fireEvent.click(toggles[9]); // setUseMultiAccountBalanceCheckerStub
    fireEvent.click(toggles[10]); // setUseTransactionSimulationsStub
    fireEvent.click(toggles[11]); // setUseAddressBarEnsResolutionStub
    fireEvent.click(toggles[12]); // setUseCurrencyRateCheckStub
    fireEvent.click(toggles[13]); // setPreferenceStub

    expect(mockOpenBasicFunctionalityModal).toHaveBeenCalledTimes(1);

    fireEvent.click(submitButton);

    expect(toggleExternalServicesStub).toHaveBeenCalledTimes(1);
    expect(setIncomingTransactionsPreferencesStub).toHaveBeenCalledTimes(4);
    expect(setUsePhishDetectStub).toHaveBeenCalledTimes(1);
    expect(setUse4ByteResolutionStub).toHaveBeenCalledTimes(1);
    expect(setUseTokenDetectionStub).toHaveBeenCalledTimes(1);
    expect(setUseMultiAccountBalanceCheckerStub).toHaveBeenCalledTimes(1);
    expect(setUseCurrencyRateCheckStub).toHaveBeenCalledTimes(1);
    expect(setUseAddressBarEnsResolutionStub).toHaveBeenCalledTimes(1);
    expect(setUseTransactionSimulationsStub).toHaveBeenCalledTimes(1);
    expect(setPreferenceStub).toHaveBeenCalledTimes(1);

    expect(setIncomingTransactionsPreferencesStub).toHaveBeenCalledWith(
      CHAIN_IDS.MAINNET,
      false,
      expect.anything(),
    );
    // toggleExternalServices is true still because modal is "open" but not confirmed yet
    expect(toggleExternalServicesStub.mock.calls[0][0]).toStrictEqual(true);
    expect(setUsePhishDetectStub.mock.calls[0][0]).toStrictEqual(false);
    expect(setUse4ByteResolutionStub.mock.calls[0][0]).toStrictEqual(false);
    expect(setUseTokenDetectionStub.mock.calls[0][0]).toStrictEqual(true);
    expect(setUseMultiAccountBalanceCheckerStub.mock.calls[0][0]).toStrictEqual(
      false,
    );
    expect(setUseCurrencyRateCheckStub.mock.calls[0][0]).toStrictEqual(false);
    expect(setUseAddressBarEnsResolutionStub.mock.calls[0][0]).toStrictEqual(
      false,
    );
    expect(setUseTransactionSimulationsStub.mock.calls[0][0]).toStrictEqual(
      false,
    );
    expect(setPreferenceStub.mock.calls[0][0]).toStrictEqual(
      'petnamesEnabled',
      false,
    );
  });

  describe('IPFS', () => {
    it('should handle proper IPFS input', () => {
      const { queryByTestId, queryByText } = renderWithProvider(
        <PrivacySettings />,
        store,
      );

      const ipfsInput = queryByTestId('ipfs-input');
      const ipfsEvent = {
        target: {
          value: 'ipfs.io',
        },
      };

      fireEvent.change(ipfsInput, ipfsEvent);

      const validIpfsUrl = queryByText('IPFS gateway URL is valid');
      expect(validIpfsUrl).toBeInTheDocument();

      const submitButton = queryByText('Done');
      fireEvent.click(submitButton);

      expect(setIpfsGatewayStub).toHaveBeenCalled();
    });

    it('should error with gateway.ipfs.io IPFS input', () => {
      const { queryByTestId, queryByText } = renderWithProvider(
        <PrivacySettings />,
        store,
      );

      const ipfsInput = queryByTestId('ipfs-input');
      const ipfsEvent = {
        target: {
          value: 'gateway.ipfs.io',
        },
      };

      fireEvent.change(ipfsInput, ipfsEvent);

      const invalidErrorMsg = queryByText('Please enter a valid URL');

      expect(invalidErrorMsg).toBeInTheDocument();
    });

    it('should error with improper IPFS input', () => {
      const { queryByTestId, queryByText } = renderWithProvider(
        <PrivacySettings />,
        store,
      );

      const ipfsInput = queryByTestId('ipfs-input');
      const ipfsEvent = {
        target: {
          value: ' ',
        },
      };

      fireEvent.change(ipfsInput, ipfsEvent);

      const invalidErrorMsg = queryByText('Please enter a valid URL');

      expect(invalidErrorMsg).toBeInTheDocument();
    });
  });
});
