import { act, renderHook } from '@testing-library/react';
import {
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_SIDEPANEL,
} from '../../../shared/constants/app';
import { useIsCompactSettingsLayout } from './useIsCompactSettingsLayout';

const mockGetEnvironmentType = jest.fn();

jest.mock('../../../shared/lib/environment-type', () => ({
  ...jest.requireActual('../../../shared/lib/environment-type'),
  getEnvironmentType: () => mockGetEnvironmentType(),
}));

const setWindowWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  });
};

describe('useIsCompactSettingsLayout', () => {
  const originalInnerWidth = window.innerWidth;

  afterEach(() => {
    setWindowWidth(originalInnerWidth);
  });

  it('returns true in the popup', () => {
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_POPUP);

    const { result } = renderHook(() => useIsCompactSettingsLayout());

    expect(result.current).toBe(true);
  });

  it('returns false in fullscreen, even when the window is narrow', () => {
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_FULLSCREEN);
    setWindowWidth(400);

    const { result } = renderHook(() => useIsCompactSettingsLayout());

    expect(result.current).toBe(false);
  });

  it('returns true in a narrow sidepanel', () => {
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_SIDEPANEL);
    setWindowWidth(575);

    const { result } = renderHook(() => useIsCompactSettingsLayout());

    expect(result.current).toBe(true);
  });

  it('returns false in a wide sidepanel', () => {
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_SIDEPANEL);
    setWindowWidth(576);

    const { result } = renderHook(() => useIsCompactSettingsLayout());

    expect(result.current).toBe(false);
  });

  it('updates when the sidepanel is resized', () => {
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_SIDEPANEL);
    setWindowWidth(800);
    const { result } = renderHook(() => useIsCompactSettingsLayout());

    act(() => {
      setWindowWidth(400);
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current).toBe(true);
  });
});
