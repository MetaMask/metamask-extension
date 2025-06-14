import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { NameType } from '@metamask/name-controller';
import { ResultType } from '../../app/scripts/lib/trust-signals/types';
import { useTrustSignals, TrustSignalState } from './useTrustSignals';
import { IconName } from '../components/component-library';
import configureStore from 'redux-mock-store';

const mockStore = configureStore([]);

describe('useTrustSignals', () => {
  const createWrapper = (state = {}) => {
    const store = mockStore({
      metamask: {
        addressSecurityAlertResponses: {},
        ...state,
      },
    });

    // eslint-disable-next-line react/display-name
    return ({ children }: { children: React.ReactNode }) => {
      return React.createElement(Provider, { store }, children);
    };
  };

  it('should return null state when no security alert response exists', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useTrustSignals('0x123', NameType.ETHEREUM_ADDRESS),
      { wrapper },
    );

    expect(result.current).toEqual({ state: null });
  });

  it('should return null state for non-Ethereum addresses', () => {
    const wrapper = createWrapper({
      addressSecurityAlertResponses: {
        '0x123': {
          result_type: ResultType.Malicious,
          label: 'Test label',
        },
      },
    });

    // Using a non-ethereum address type to test the filtering
    const { result } = renderHook(
      () => useTrustSignals('bnb123', 'bnb_address' as NameType),
      { wrapper },
    );

    expect(result.current).toEqual({ state: null });
  });

  it('should map Trusted result to Verified state', () => {
    const wrapper = createWrapper({
      addressSecurityAlertResponses: {
        '0x123': {
          result_type: ResultType.Trusted,
          label: 'Trusted Address',
        },
      },
    });

    const { result } = renderHook(
      () => useTrustSignals('0x123', NameType.ETHEREUM_ADDRESS),
      { wrapper },
    );

    expect(result.current).toEqual({
      state: TrustSignalState.Verified,
      label: 'Trusted Address',
      iconName: IconName.Verified,
    });
  });

  it('should map Benign result to Verified state', () => {
    const wrapper = createWrapper({
      addressSecurityAlertResponses: {
        '0x123': {
          result_type: ResultType.Benign,
          label: 'Safe Address',
        },
      },
    });

    const { result } = renderHook(
      () => useTrustSignals('0x123', NameType.ETHEREUM_ADDRESS),
      { wrapper },
    );

    expect(result.current).toEqual({
      state: TrustSignalState.Verified,
      label: 'Safe Address',
      iconName: IconName.Verified,
    });
  });

  it('should map Warning result to Warning state', () => {
    const wrapper = createWrapper({
      addressSecurityAlertResponses: {
        '0x123': {
          result_type: ResultType.Warning,
          label: 'Suspicious Address',
        },
      },
    });

    const { result } = renderHook(
      () => useTrustSignals('0x123', NameType.ETHEREUM_ADDRESS),
      { wrapper },
    );

    expect(result.current).toEqual({
      state: TrustSignalState.Warning,
      label: 'Suspicious Address',
      iconName: IconName.Warning,
    });
  });

  it('should map Malicious result to Malicious state', () => {
    const wrapper = createWrapper({
      addressSecurityAlertResponses: {
        '0x123': {
          result_type: ResultType.Malicious,
          label: 'Malicious Address',
        },
      },
    });

    const { result } = renderHook(
      () => useTrustSignals('0x123', NameType.ETHEREUM_ADDRESS),
      { wrapper },
    );

    expect(result.current).toEqual({
      state: TrustSignalState.Malicious,
      label: 'Malicious Address',
      iconName: IconName.Danger,
    });
  });

  it('should map ErrorResult to Unknown state', () => {
    const wrapper = createWrapper({
      addressSecurityAlertResponses: {
        '0x123': {
          result_type: ResultType.ErrorResult,
          label: 'Error checking address',
        },
      },
    });

    const { result } = renderHook(
      () => useTrustSignals('0x123', NameType.ETHEREUM_ADDRESS),
      { wrapper },
    );

    expect(result.current).toEqual({
      state: TrustSignalState.Unknown,
      label: 'Error checking address',
      iconName: IconName.Question,
    });
  });

  it('should handle case insensitive addresses', () => {
    const wrapper = createWrapper({
      addressSecurityAlertResponses: {
        '0x123abc': {
          result_type: ResultType.Trusted,
          label: 'Trusted Address',
        },
      },
    });

    const { result } = renderHook(
      () => useTrustSignals('0x123ABC', NameType.ETHEREUM_ADDRESS),
      { wrapper },
    );

    expect(result.current).toEqual({
      state: TrustSignalState.Verified,
      label: 'Trusted Address',
      iconName: IconName.Verified,
    });
  });
});
