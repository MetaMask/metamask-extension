import { createElement, ReactNode } from 'react';
import { Provider } from 'react-redux';
import { renderHook } from '@testing-library/react-hooks';
import configureStore from '../../store/store';
import mockState from '../../../test/data/mock-state.json';
import { useOriginTitle } from './useOriginTitle';

const createMockState = (overrides = {}) => ({
  ...mockState,
  metamask: {
    ...mockState.metamask,
    ...overrides,
  },
});

const renderHookWithStore = (origin?: string, stateOverrides = {}) => {
  const state = createMockState(stateOverrides);
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(Provider, { store: configureStore(state) }, children);

  return renderHook(() => useOriginTitle(origin), { wrapper });
};

describe('useOriginTitle', () => {
  it('returns the origin title for a Snap ID', () => {
    const { result } = renderHookWithStore('npm:@metamask/test-snap-bip44');
    expect(result.current).toBe('BIP-44 Test Snap');
  });

  it('returns the origin title for a website origin', () => {
    const { result } = renderHookWithStore('https://example.com');
    expect(result.current).toBe('example.com');
  });

  it('returns "Unknown Origin" for undefined origin', () => {
    const { result } = renderHookWithStore(undefined);
    expect(result.current).toBe('Unknown Origin');
  });

  it('returns "Unknown Origin" for an invalid origin', () => {
    const { result } = renderHookWithStore('invalid-origin');
    expect(result.current).toBe('Unknown Origin');
  });
});
