import { renderHookWithProvider } from '../../test/lib/render-helpers';
import {
  useMultichainAccountsIntroModal,
  BIP44_ACCOUNTS_INTRODUCTION_VERSION,
} from './useMultichainAccountsIntroModal';

describe('useMultichainAccountsIntroModal', () => {
  const renderHook = (
    isUnlocked: boolean,
    isMultichainAccountsEnabled: boolean,
    hasShownMultichainAccountsIntroModal: boolean,
    lastUpdatedAt: number | null,
    previousAppVersion: string | null,
    pathname: string,
  ) => {
    return renderHookWithProvider(
      () => useMultichainAccountsIntroModal(isUnlocked, { pathname }),
      {
        metamask: {
          remoteFeatureFlags: {
            enableMultichainAccountsState2: {
              enabled: isMultichainAccountsEnabled,
              featureVersion: '2',
              minimumVersion: BIP44_ACCOUNTS_INTRODUCTION_VERSION,
            },
          },
          hasShownMultichainAccountsIntroModal,
          previousAppVersion,
          lastUpdatedAt,
        },
      },
    );
  };

  describe('shows banner correctly', () => {
    const baseParams = {
      isUnlocked: true,
      isMultichainAccountsEnabled: true,
      hasShownModalBefore: false,
      lastUpdatedAt: Date.now(),
      isMainRoute: true,
    };

    it('shows banner for upgrade from 13.4.0', () => {
      const { result } = renderHook(
        baseParams.isUnlocked,
        baseParams.isMultichainAccountsEnabled,
        baseParams.hasShownModalBefore,
        baseParams.lastUpdatedAt,
        '13.4.0',
        '/',
      );
      expect(result.current.showMultichainIntroModal).toBe(true);
    });

    it('shows banner for upgrade from 13.4.0-flask.0', () => {
      const { result } = renderHook(
        baseParams.isUnlocked,
        baseParams.isMultichainAccountsEnabled,
        baseParams.hasShownModalBefore,
        baseParams.lastUpdatedAt,
        '13.4.0-flask.0',
        '/',
      );
      expect(result.current.showMultichainIntroModal).toBe(true);
    });

    it('shows banner for upgrade from 12.0.0', () => {
      const { result } = renderHook(
        true,
        true,
        false,
        Date.now(),
        '12.0.0',
        '/',
      );
      expect(result.current.showMultichainIntroModal).toBe(true);
    });

    it('shows banner for upgrade from 13.4.9 (just before threshold)', () => {
      const { result } = renderHook(
        true,
        true,
        false,
        Date.now(),
        '13.4.9',
        '/',
      );
      expect(result.current.showMultichainIntroModal).toBe(true);
    });
  });

  describe('does NOT show banner correctly', () => {
    it('does NOT show for upgrade from 13.5.0 (threshold version)', () => {
      const { result } = renderHook(
        true,
        true,
        false,
        Date.now(),
        '13.5.0',
        '/',
      );
      expect(result.current.showMultichainIntroModal).toBe(false);
    });

    it('does NOT show for upgrade from 13.5.0-flask.0 (threshold version)', () => {
      const { result } = renderHook(
        true,
        true,
        false,
        Date.now(),
        '13.5.0-flask.0',
        '/',
      );
      expect(result.current.showMultichainIntroModal).toBe(false);
    });

    it('does NOT show for upgrade from 13.7.0', () => {
      const { result } = renderHook(
        true,
        true,
        false,
        Date.now(),
        '13.7.0',
        '/',
      );
      expect(result.current.showMultichainIntroModal).toBe(false);
    });

    it('does NOT show for fresh install (no previous version)', () => {
      const { result } = renderHook(true, true, false, Date.now(), null, '/');
      expect(result.current.showMultichainIntroModal).toBe(false);
    });

    it('does NOT show when wallet is locked', () => {
      const { result } = renderHook(
        false,
        true,
        false,
        Date.now(),
        '13.4.0',
        '/',
      );
      expect(result.current.showMultichainIntroModal).toBe(false);
    });

    it('does NOT show when multichain accounts disabled', () => {
      const { result } = renderHook(
        true,
        false,
        false,
        Date.now(),
        '13.4.0',
        '/',
      );
      expect(result.current.showMultichainIntroModal).toBe(false);
    });

    it('does NOT show when modal already shown', () => {
      const { result } = renderHook(
        true,
        true,
        true,
        Date.now(),
        '13.4.0',
        '/',
      );
      expect(result.current.showMultichainIntroModal).toBe(false);
    });

    it('does NOT show on non-main route', () => {
      const { result } = renderHook(
        true,
        true,
        false,
        Date.now(),
        '13.4.0',
        '/confirmation/foo',
      );
      expect(result.current.showMultichainIntroModal).toBe(false);
    });

    it('does NOT show for fresh install (lastUpdatedAt is null)', () => {
      const { result } = renderHook(true, true, false, null, '13.4.0', '/');
      expect(result.current.showMultichainIntroModal).toBe(false);
    });
  });
});
