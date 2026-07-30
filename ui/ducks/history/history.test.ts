import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import reducer, {
  pageChanged,
  setRedirectAfterDefaultPage,
  clearRedirectAfterDefaultPage,
} from './history';

type HistoryState = {
  mostRecentOverviewPage: string;
  redirectAfterDefaultPage: {
    path?: string;
    shouldRedirect?: boolean;
    address?: string;
  } | null;
};

const SWAP_ROUTE = '/cross-chain/swaps/prepare-bridge-page';

const getInitialState = (): HistoryState =>
  reducer(undefined, { type: '@@INIT' });

describe('history duck', () => {
  describe('setRedirectAfterDefaultPage', () => {
    it('creates a redirect instruction', () => {
      const state = reducer(
        getInitialState(),
        setRedirectAfterDefaultPage({ path: SWAP_ROUTE }),
      );

      expect(state.redirectAfterDefaultPage).toStrictEqual({
        path: SWAP_ROUTE,
        shouldRedirect: true,
        address: undefined,
      });
    });
  });

  describe('pageChanged', () => {
    it('stops the pending redirect once its target path is reached', () => {
      const redirect = reducer(
        getInitialState(),
        setRedirectAfterDefaultPage({ path: `${SWAP_ROUTE}?to=tron` }),
      );

      const state = reducer(redirect, pageChanged(SWAP_ROUTE));

      expect(state.redirectAfterDefaultPage).toBeNull();
    });

    it('leaves the pending redirect while en route to its target', () => {
      const redirect = reducer(
        getInitialState(),
        setRedirectAfterDefaultPage({ path: `${SWAP_ROUTE}?to=tron` }),
      );

      const state = reducer(redirect, pageChanged('/some-other-route'));

      expect(state.redirectAfterDefaultPage).toStrictEqual({
        path: `${SWAP_ROUTE}?to=tron`,
        shouldRedirect: true,
        address: undefined,
      });
    });

    it('stops the pending redirect when landing on the default route', () => {
      const redirect = reducer(
        getInitialState(),
        setRedirectAfterDefaultPage({ path: SWAP_ROUTE }),
      );

      const state = reducer(redirect, pageChanged(DEFAULT_ROUTE));

      expect(state.redirectAfterDefaultPage).toBeNull();
      expect(state.mostRecentOverviewPage).toBe(DEFAULT_ROUTE);
    });
  });
});
