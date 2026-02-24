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
import { clearSwapsState } from '../../ducks/swaps/swaps';
import { resetBackgroundSwapsState } from '../../store/actions';

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
 * @returns a function to navigate to a bridge-related page, and the current navigation state
 */
export const useBridgeNavigation = () => {
  const navigateUtil = useNavigate();
  const dispatch = useDispatch();

  const { search, pathname, state: maybeState } = useLocation();
  const state: BridgeNavigationOptions['state'] = useMemo(
    () => maybeState ?? {},
    [maybeState],
  );

  const navigate = useCallback(
    (to: To, options: BridgeNavigationOptions) => {
      navigateUtil(to, {
        ...options,
        state: {
          ...options.state,
        },
      });
    },
    [navigateUtil],
  );

  /**
   * Navigates to the current route and clears the location state.
   * @param to - The default route to navigate to.
   */
  const resetLocationState = useCallback(
    (to: To = { pathname }) =>
      navigate(to, {
        state: {
          ...state,
          token: null,
        },
        replace: true,
      }),
    [navigate, state, pathname],
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
    [search, pathname, navigate, state],
  );

  /**
   * Navigates to the bridge page.
   * @param token - The token to set after loading the bridge page.
   * @param searchParams - The search params for deep-link input parameters.
   */
  const navigateToBridgePage = useCallback(
    (
      params: {
        token: BridgeNavigationOptions['state']['token'];
        searchParams: string;
        preventBackNavigation: boolean;
      } = {
        token: state?.token,
        searchParams: new URLSearchParams('').toString(),
        preventBackNavigation: true,
      },
    ) => {
      const { token, searchParams, preventBackNavigation } = params;
      navigate(
        {
          pathname: `${CROSS_CHAIN_SWAP_ROUTE}${PREPARE_SWAP_ROUTE}`,
          search: searchParams,
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
    [navigate, state],
  );

  /**
   * Navigates to the hw transaction signing page.
   */
  const navigateToHwSigningPage = useCallback(() => {
    navigate(`${CROSS_CHAIN_SWAP_ROUTE}${AWAITING_SIGNATURES_ROUTE}`, {
      state,
    });
  }, [navigate, state]);

  /**
   * Navigates to the activity page.
   * @param shouldResetNavigationState - Whether to reset the navigation state. If
   * false, the input params will be restored when the user re-enters the bridge flow.
   */
  const navigateToActivityPage = useCallback(
    (shouldResetNavigationState: boolean = true) => {
      navigate(`${DEFAULT_ROUTE}?tab=activity`, {
        state: {
          ...state,
          token: shouldResetNavigationState ? null : state?.token,
          stayOnHomePage: true,
        },
      });
    },
    [navigate, state],
  );

  const navigateToDefaultRoute = useCallback(async () => {
    // TODO remove these when swaps codebase is removed
    dispatch(clearSwapsState());
    dispatch(resetBackgroundSwapsState());

    const isFromTransactionShield = new URLSearchParams(search || '').get(
      BridgeQueryParams.IsFromTransactionShield,
    );
    if (isFromTransactionShield) {
      resetLocationState(TRANSACTION_SHIELD_ROUTE);
    } else {
      navigate(DEFAULT_ROUTE, {
        state: {
          token: null,
          stayOnHomePage: true,
        },
        replace: true,
      });
    }
  }, [search, navigate, resetLocationState]);

  return {
    token: state.token,
    search,
    resetLocationState,
    resetSearchParams,
    navigateToBridgePage,
    navigateToHwSigningPage,
    navigateToActivityPage,
    navigateToDefaultRoute,
  };
};
