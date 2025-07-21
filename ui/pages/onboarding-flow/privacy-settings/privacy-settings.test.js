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
  const setUseTokenDetectionStub = jest.fn().mockResolvedValue();
  const setUseCurrencyRateCheckStub = jest.fn().mockResolvedValue();
  const setIpfsGatewayStub = jest.fn().mockResolvedValue();
  const completeOnboardingStub = jest.fn().mockResolvedValue();
  const setUseMultiAccountBalanceCheckerStub = jest.fn().mockResolvedValue();
  const setUseAddressBarEnsResolutionStub = jest.fn().mockResolvedValue();
  const onboardingToggleBasicFunctionalityOnStub = jest.fn();
  const toggleExternalServicesStub = jest.fn();
  const setUseTransactionSimulationsStub = jest.fn();
  const setPreferenceStub = jest.fn();

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
  });

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

    // Default Settings - General category
    const itemCategoryGeneral = queryByTestId('category-item-General');
    expect(itemCategoryGeneral).toBeInTheDocument();
    fireEvent.click(itemCategoryGeneral);

    let toggles = container.querySelectorAll('input[type=checkbox]');
    const backButton = queryByTestId('privacy-settings-back-button');

    fireEvent.click(toggles[0]); // toggleExternalServicesStub

    // Default Settings - Assets category
    const itemCategoryAssets = queryByTestId('category-item-Assets');
    fireEvent.click(itemCategoryAssets);

    toggles = container.querySelectorAll('input[type=checkbox]');

    fireEvent.click(toggles[0]); // setUseTokenDetectionStub
    fireEvent.click(toggles[1]); // setUseTransactionSimulationsStub

    fireEvent.click(toggles[2]); // setUseCurrencyRateCheckStub
    fireEvent.click(toggles[3]); // setUseAddressBarEnsResolutionStub
    fireEvent.click(toggles[4]); // setUseMultiAccountBalanceCheckerStub

    // Default Settings - Security category
    const itemCategorySecurity = queryByTestId('category-item-Security');
    fireEvent.click(itemCategorySecurity);

    toggles = container.querySelectorAll('input[type=checkbox]');

    fireEvent.click(toggles[0]); // setUse4ByteResolutionStub
    fireEvent.click(toggles[1]); // setPreferenceStub

    fireEvent.click(backButton);

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

  describe('IPFS', () => {
    it('should handle proper IPFS input', () => {
      const { queryByTestId, queryByText } = renderWithProvider(
        <PrivacySettings />,
        store,
      );

      const itemCategoryAssets = queryByTestId('category-item-Assets');
      fireEvent.click(itemCategoryAssets);

      const ipfsInput = queryByTestId('ipfs-input');
      const ipfsEvent = {
        target: {
          value: 'ipfs.io',
        },
      };

      fireEvent.change(ipfsInput, ipfsEvent);

      const validIpfsUrl = queryByText('IPFS gateway URL is valid');
      expect(validIpfsUrl).toBeInTheDocument();

      const backButton = queryByTestId('privacy-settings-back-button');
      fireEvent.click(backButton);

      expect(setIpfsGatewayStub).toHaveBeenCalled();
    });

    it('should error with gateway.ipfs.io IPFS input', () => {
      const { queryByTestId, queryByText } = renderWithProvider(
        <PrivacySettings />,
        store,
      );

      const itemCategoryAssets = queryByTestId('category-item-Assets');
      fireEvent.click(itemCategoryAssets);

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

      const itemCategoryAssets = queryByTestId('category-item-Assets');
      fireEvent.click(itemCategoryAssets);

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
