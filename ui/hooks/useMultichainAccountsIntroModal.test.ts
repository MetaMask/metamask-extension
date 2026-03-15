import { renderHookWithProvider } from '../../test/lib/render-helpers-navigate';
import {
  useMultichainAccountsIntroModal,
  BIP44_ACCOUNTS_INTRODUCTION_VERSION,
} from './useMultichainAccountsIntroModal';

describe('useMultichainAccountsIntroModal', () => {
  const renderHook = (
    isUnlocked: boolean,
    hasShownMultichainAccountsIntroModal: boolean,
    lastUpdatedAt: number | null,
    previousAppVersion: string | null,
    pathname: string,
    currentAppVersion: string = '13.18.1', // Default to current version
  ) => {
    return renderHookWithProvider(
      () => useMultichainAccountsIntroModal(isUnlocked, { pathname }),
      {
        metamask: {
          remoteFeatureFlags: {
            enableMultichainAccountsState2: {
              enabled: true,
              featureVersion: '2',
              minimumVersion: BIP44_ACCOUNTS_INTRODUCTION_VERSION,
            },
          },
          hasShownMultichainAccountsIntroModal,
          previousAppVersion,
          currentAppVersion,
          lastUpdatedAt,
        },
      },
    );
  };

  describe('shows banner correctly', () => {
    const baseParams = {
      isUnlocked: true,
      hasShownModalBefore: false,
      lastUpdatedAt: Date.now(),
      isMainRoute: true,
    };

    it('shows banner for upgrade from 13.4.0', () => {
      const { result } = renderHook(
        baseParams.isUnlocked,
        baseParams.hasShownModalBefore,
        baseParams.lastUpdatedAt,
        '13.4.0',
        '/',
        '13.4.9', // Current version is below threshold
      );
      expect(result.current.showMultichainIntroModal).toBe(true);
    });

    it('shows banner for upgrade from 13.4.0-flask.0', () => {
      const { result } = renderHook(
        baseParams.isUnlocked,
        baseParams.hasShownModalBefore,
        baseParams.lastUpdatedAt,
        '13.4.0-flask.0',
        '/',
        '13.4.9', // Current version is below threshold
      );
      expect(result.current.showMultichainIntroModal).toBe(true);
    });

    it('shows banner for upgrade from 12.0.0', () => {
      const { result } = renderHook(
        true,
        false,
        Date.now(),
        '12.0.0',
        '/',
        '13.4.9', // Current version is below threshold
      );
      expect(result.current.showMultichainIntroModal).toBe(true);
    });

    it('shows banner for upgrade from 13.4.9 (just before threshold)', () => {
      const { result } = renderHook(
        true,
        false,
        Date.now(),
        '13.4.9',
        '/',
        '13.4.9', // Current version is below threshold
      );
      expect(result.current.showMultichainIntroModal).toBe(true);
    });
  });

  describe('does NOT show banner correctly', () => {
    it('does NOT show for upgrade from 13.5.0 (threshold version)', () => {
      const { result } = renderHook(true, false, Date.now(), '13.5.0', '/');
      expect(result.current.showMultichainIntroModal).toBe(false);
    });

    it('does NOT show for upgrade from 13.5.0-flask.0 (threshold version)', () => {
      const { result } = renderHook(
        true,
        false,
        Date.now(),
        '13.5.0-flask.0',
        '/',
      );
      expect(result.current.showMultichainIntroModal).toBe(false);
    });

    it('does NOT show for upgrade from 13.7.0', () => {
      const { result } = renderHook(true, false, Date.now(), '13.7.0', '/');
      expect(result.current.showMultichainIntroModal).toBe(false);
    });

    it('does NOT show for upgrade from 13.18.1 (regression test for issue #40752)', () => {
      const { result } = renderHook(true, false, Date.now(), '13.18.1', '/');
      expect(result.current.showMultichainIntroModal).toBe(false);
    });

    it('does NOT show for fresh install (no previous version)', () => {
      const { result } = renderHook(true, false, Date.now(), null, '/');
      expect(result.current.showMultichainIntroModal).toBe(false);
    });

    it('does NOT show when wallet is locked', () => {
      const { result } = renderHook(false, false, Date.now(), '13.4.0', '/');
      expect(result.current.showMultichainIntroModal).toBe(false);
    });

    it('does NOT show when modal already shown', () => {
      const { result } = renderHook(true, true, Date.now(), '13.4.0', '/');
      expect(result.current.showMultichainIntroModal).toBe(false);
    });

    it('does NOT show on non-main route', () => {
      const { result } = renderHook(
        true,
        false,
        Date.now(),
        '13.4.0',
        '/confirmation/foo',
      );
      expect(result.current.showMultichainIntroModal).toBe(false);
    });

    it('does NOT show for fresh install (lastUpdatedAt is null)', () => {
      const { result } = renderHook(true, false, null, '13.4.0', '/');
      expect(result.current.showMultichainIntroModal).toBe(false);
    });

    // Additional defensive test cases for current version >= threshold
    it('does NOT show when current version >= threshold, even with old previous version', () => {
      const { result } = renderHook(
        true,
        false,
        Date.now(),
        '13.4.0', // Previous version is below threshold
        '/',
        '13.5.0', // Current version is at threshold
      );
      expect(result.current.showMultichainIntroModal).toBe(false);
    });

    it('does NOT show when current version is well above threshold', () => {
      const { result } = renderHook(
        true,
        false,
        Date.now(),
        '13.4.0', // Previous version is below threshold
        '/',
        '13.18.1', // Current version is well above threshold (regression test)
      );
      expect(result.current.showMultichainIntroModal).toBe(false);
    });

    it('does NOT show when previousAppVersion is empty string', () => {
      const { result } = renderHook(
        true,
        false,
        Date.now(),
        '', // Empty string previousAppVersion
        '/',
        '13.18.1',
      );
      expect(result.current.showMultichainIntroModal).toBe(false);
    });
  });
});
