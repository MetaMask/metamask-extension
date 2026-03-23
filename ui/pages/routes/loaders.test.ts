import type { Store } from 'redux';
import type { LoaderFunctionArgs } from 'react-router-dom';
import { ONBOARDING_ROUTE, UNLOCK_ROUTE } from '../../helpers/constants/routes';
import { createProtectedLoader, requireInitialized } from './loaders';

type MetamaskState = {
  completedOnboarding?: boolean;
  isUnlocked?: boolean;
  useExternalServices?: boolean;
};

function createStore(metamask: MetamaskState): Store {
  return {
    getState: () => ({ metamask }),
  } as unknown as Store;
}

function getRedirectLocation(value: Response | null): string | null {
  if (!value) {
    return null;
  }

  return value.headers.get('Location') ?? value.headers.get('location');
}

function createLoaderArgs(request: Request | undefined) {
  return {
    request,
    params: {},
  } as LoaderFunctionArgs<Record<string, string>>;
}

describe('loaders', () => {
  describe('requireInitialized', () => {
    it('redirects to onboarding when onboarding is not completed', () => {
      const result = requireInitialized(
        createStore({ completedOnboarding: false }),
      );

      expect(getRedirectLocation(result)).toBe(ONBOARDING_ROUTE);
    });

    it('returns null when onboarding is completed', () => {
      const result = requireInitialized(
        createStore({ completedOnboarding: true }),
      );

      expect(result).toBeNull();
    });
  });

  describe('createProtectedLoader', () => {
    it('redirects to onboarding when onboarding is not completed', () => {
      const loader = createProtectedLoader(
        createStore({ completedOnboarding: false, isUnlocked: false }),
      );

      const result = loader(
        createLoaderArgs(new Request('https://test.local/')),
      );

      expect(getRedirectLocation(result)).toBe(ONBOARDING_ROUTE);
    });

    it('redirects to unlock when wallet is locked and request is not provided', () => {
      const loader = createProtectedLoader(
        createStore({ completedOnboarding: true, isUnlocked: false }),
      );

      const result = loader(createLoaderArgs(undefined));

      expect(getRedirectLocation(result)).toBe(UNLOCK_ROUTE);
    });

    it('redirects to unlock with from query when wallet is locked', () => {
      const loader = createProtectedLoader(
        createStore({ completedOnboarding: true, isUnlocked: false }),
      );

      const result = loader(
        createLoaderArgs(
          new Request('https://test.local/bridge/prepare?foo=bar'),
        ),
      );

      expect(getRedirectLocation(result)).toBe(
        `${UNLOCK_ROUTE}?from=%2Fbridge%2Fprepare%3Ffoo%3Dbar`,
      );
    });

    it('returns null when onboarding is completed and wallet is unlocked', () => {
      const loader = createProtectedLoader(
        createStore({ completedOnboarding: true, isUnlocked: true }),
      );

      const result = loader(
        createLoaderArgs(new Request('https://test.local/')),
      );

      expect(result).toBeNull();
    });
  });
});
