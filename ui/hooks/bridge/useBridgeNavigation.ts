import { useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import {
  type NavigateOptions,
  type To,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { type CaipChainId, type Hex } from '@metamask/utils';
import { AssetType } from '@metamask/bridge-controller';
import { BridgeQueryParams } from '../../../shared/lib/deep-links/routes/swap';
import { DEFAULT_ROUTE } from '../../../shared/lib/deep-links/routes/route';
import {
  AWAITING_SIGNATURES_ROUTE,
  CROSS_CHAIN_SWAP_ROUTE,
  PREPARE_SWAP_ROUTE,
  TRANSACTION_SHIELD_ROUTE,
} from '../../helpers/constants/routes';
import type { MinimalAsset } from '../../pages/bridge/utils/tokens';
import { resetBridgeControllerAndCache } from '../../ducks/bridge/actions';

export type BridgeNavigationOptions = Omit<NavigateOptions, 'state'> & {
  state: {
    /**
     * If this is set, it will be used to set the `fromToken` when the user navigates to the bridge page.
     */
    token:
      | (MinimalAsset & {
          type?: AssetType;
          address?: string;
          image?: null | string;
          chainId: Hex | CaipChainId;
          isNative?: boolean;
        })
      | null;
    /**
     * If this is set, the user will not be redirected back to the home page regardless of
     * the presence of a bridgeState or token. Used to prevent redirecting back to the bridge
     * page after transaction submission.
     */
    stayOnHomePage?: boolean;
  };
};

/**
 * Handles navigation between bridge-related pages, and enforces a single source of truth
 * for the bridge navigation state. The navigation state is used for persisting and restoring data
 * when the user navigates (see usePrefilledQuoteParams hook).
 *
 * @returns a function to navigate to a bridge route, and the current navigation state
 */
export const useBridgeNavigation = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { search, pathname, state: maybeState } = useLocation();
  const state: BridgeNavigationOptions['state'] = useMemo(
    () => maybeState ?? { token: null },
    [maybeState],
  );

  /**
   * Navigates to the current route and clears the location state.
   * @param to - The default route to navigate to.
   */
  const resetLocationState = useCallback(
    (to: To = { pathname }, stayOnHomePage = false) =>
      navigate(to, {
        state: {
          ...state,
          token: null,
          stayOnHomePage,
        },
        replace: true,
      }),
    [state, pathname],
  );

  /**
   * Clears the search params for the given parameters.
   * @param paramsToRemove - The parameters to clear.
   */
  const resetSearchParams = useCallback(
    (paramsToRemove: BridgeQueryParams[]) => {
      const updatedSearchParams = new URLSearchParams(search);
      paramsToRemove.forEach((param) => {
        if (updatedSearchParams.get(param)) {
          updatedSearchParams.delete(param);
        }
      });
      navigate(
        {
          pathname,
          search: updatedSearchParams.toString(),
        },
        {
          replace: true,
          state,
        },
      );
    },
    [search, pathname, state],
  );

  /**
   * Navigates to the bridge page.
   * @param token - The token to set after loading the bridge page.
   * @param search - The search params for deep-link input parameters.
   */
  const navigateToBridgePage = useCallback(
    (
      params: {
        token: BridgeNavigationOptions['state']['token'];
        search: URLSearchParams;
        preventBackNavigation: boolean;
      } = {
        token: state?.token,
        search: new URLSearchParams(''),
        preventBackNavigation: true,
      },
    ) => {
      const { token, search, preventBackNavigation } = params;
      navigate(
        {
          pathname: `${CROSS_CHAIN_SWAP_ROUTE}${PREPARE_SWAP_ROUTE}`,
          search: search.toString(),
        },
        {
          state: {
            ...state,
            token,
          },
          replace: preventBackNavigation,
        },
      );
    },
    [state],
  );

  /**
   * Navigates to the hw transaction signing page.
   */
  const navigateToHwSigningPage = useCallback(() => {
    navigate(
      {
        pathname: `${CROSS_CHAIN_SWAP_ROUTE}${AWAITING_SIGNATURES_ROUTE}`,
      },
      {
        state,
      },
    );
  }, [state]);

  /**
   * Navigates to the activity page and clears the navigation state.
   */
  const navigateToActivityPage = useCallback(() => {
    navigate(`${DEFAULT_ROUTE}?tab=activity`, {
      state: {
        ...state,
        token: null,
        stayOnHomePage: true,
      },
      replace: true,
    });
  }, [state]);

  const navigateToDefaultRoute = useCallback(async () => {
    dispatch(resetBridgeControllerAndCache());
    const isFromTransactionShield = new URLSearchParams(search || '').get(
      BridgeQueryParams.IsFromTransactionShield,
    );
    if (isFromTransactionShield) {
      resetLocationState(TRANSACTION_SHIELD_ROUTE);
    } else {
      resetLocationState(DEFAULT_ROUTE, true);
    }
  }, [search, resetLocationState]);

  const memoizedToken = useMemo(() => state.token, [state.token]);

  return {
    /**
     * The token propagated through the bridge navigation state when the Swap button is clicked
     * from the asset page
     */
    token: memoizedToken,
    search,
    resetLocationState,
    resetSearchParams,
    navigateToBridgePage,
    navigateToHwSigningPage,
    navigateToActivityPage,
    navigateToDefaultRoute,
  };
};
