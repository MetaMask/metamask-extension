import React from 'react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { renderHook } from '@testing-library/react-hooks';
import { usePerpsEligibility } from './usePerpsEligibility';

const mockStore = configureMockStore([]);

function createMockState(isEligible: boolean) {
  return {
    metamask: {
      isEligible,
    },
  };
}

function renderWithStore(isEligible: boolean) {
  const store = mockStore(createMockState(isEligible));
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  return renderHook(() => usePerpsEligibility(), { wrapper });
}

describe('usePerpsEligibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns isEligible from controller state', () => {
    const { result } = renderWithStore(true);

    expect(result.current.isEligible).toBe(true);
  });

  it('returns isEligible false when controller state is false', () => {
    const { result } = renderWithStore(false);

    expect(result.current.isEligible).toBe(false);
  });

  it('returns false when metamask.isEligible is undefined', () => {
    const store = mockStore({ metamask: {} });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );
    const { result } = renderHook(() => usePerpsEligibility(), { wrapper });

    expect(result.current.isEligible).toBe(false);
  });
});
