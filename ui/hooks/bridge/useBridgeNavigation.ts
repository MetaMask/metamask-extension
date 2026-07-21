import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  type NavigateOptions,
  type To,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import {
  type CaipChainId,
  type Hex,
  parseCaipAssetType,
} from '@metamask/utils';
import {
  AssetType,
  FeatureId,
  formatAddressToCaipReference,
  formatChainIdToHex,
  isNativeAddress,
  isNonEvmChainId,
  UnifiedSwapBridgeEventName,
} from '@metamask/bridge-controller';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { buildAssetRoutePath } from '../../../shared/lib/asset-route';
import { BridgeQueryParams } from '../../../shared/lib/deep-links/routes/swap';
import { DEFAULT_ROUTE } from '../../../shared/lib/deep-links/routes/route';
import {
  CROSS_CHAIN_SWAP_ROUTE,
  HARDWARE_WALLET_SIGNATURES_ROUTE,
  PREPARE_SWAP_ROUTE,
  TRANSACTION_SHIELD_ROUTE,
} from '../../helpers/constants/routes';
import { getBridgeState } from '../../ducks/bridge/selectors';
import type { MinimalAsset } from '../../pages/bridge/utils/tokens';
import type { BridgeState, BridgeToken } from '../../ducks/bridge/types';
import {
  resetBridgeController,
  trackUnifiedSwapBridgeEvent,
} from '../../ducks/bridge/actions';
import { getEnvironmentType } from '../../../shared/lib/environment-type';

export type BridgeNavigationOptions = Omit<NavigateOptions, 'state'> & {
  state: {
    /**
     * If this is set, it will be used to rehydrate the bridge store when the user navigates to the bridge page.
     */
    bridgeState: BridgeState | null;
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
     * If this is set, the user will be redirected back to the home page regardless of
     * the presence of a bridgeState or token. Used to prevent redirecting back to the bridge
     * page after transaction submission.
     */
    stayOnHomePage?: boolean;
    /**
     * Prepared sendBundle transaction metadata for hardware-wallet signing on
     * the shared signing page.
     */
    sendBundle?: {
      txMeta: TransactionMeta;
      needsTwoConfirmations: boolean;
      returnRoute?: string;
      /**
       * The pending approval id captured at navigation time. The signing page
       * refuses to submit unless this id is still present in
       * `state.metamask.pendingApprovals` — prevents signing a stale txMeta
       * after back/forward navigation or stale nav state. Wallet-safety guard
       * ported from mobile's `useHardwareWalletSubmit.submitSendFlow`.
       */
      approvalRequestId: string;
      /**
       * The display amount being sent (e.g. "1.5"), used to label the send
       * step. Derived in the confirmations flow from the same source the send
       * screen uses, so the HW signing label matches what the user saw.
       */
      sendAmount?: string;
      /**
       * The symbol of the token being sent (e.g. "ETH" or "USDC"), used to
       * label the send step.
       */
      sendSymbol?: string;
      /**
       * The symbol of the token used to pay the network fee (always the
       * chain's native currency, e.g. "ETH"). Used to label the gas-payment
       * step. Distinct from `sendSymbol` for ERC20 sends (send USDC, pay gas
       * in ETH).
       */
      gasSymbol?: string;
    } | null;
  };
};

const clearSendBundleIfPresent = (state: BridgeNavigationOptions['state']) =>
  Object.hasOwn(state, 'sendBundle') ? { sendBundle: null } : {};

/**
 * Builds a "cleared" bridge navigation state: preserves any extra props from
 * `baseState` while resetting `bridgeState`, `token`, and any existing
 * `sendBundle` to null and setting `stayOnHomePage` to the given value.
 *
 * @param baseState - The base navigation state to spread (extra props pass through).
 * @param stayOnHomePage - Whether the user should be kept on the home page.
 * @returns The cleared navigation state.
 */
const clearedBridgeState = (
  baseState: BridgeNavigationOptions['state'],
  stayOnHomePage: boolean,
): BridgeNavigationOptions['state'] => ({
  ...baseState,
  bridgeState: null,
  token: null,
  ...clearSendBundleIfPresent(baseState),
  stayOnHomePage,
});

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
    () => maybeState ?? {},
    [maybeState],
  );
  const bridgeState = useSelector(getBridgeState);

  /**
   * Navigates to the current route and clears the location state.
   * @param to - The default route to navigate to.
   */
  const resetLocationState = useCallback(
    (to: To = { pathname }, stayOnHomePage = false) => {
      navigate(to, {
        state: clearedBridgeState(state, stayOnHomePage),
      });
    },
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
    [navigate, search, pathname, state],
  );

  /**
   * Navigates to the bridge page.
   * @param token - The token to set after loading the bridge page.
   * @param isEntrypoint - Whether the bridge page is being loaded for the first time.
   * @param search - The search params for deep-link input parameters.
   */
  const navigateToBridgePage = useCallback(
    (
      params: {
        token: BridgeNavigationOptions['state']['token'];
        search: URLSearchParams;
        isEntrypoint: boolean;
      } = {
        token: state?.token,
        search: new URLSearchParams(''),
        isEntrypoint: false,
      },
    ) => {
      const { token, search: searchParams, isEntrypoint } = params;
      // Publish PageViewed event on initial page view
      isEntrypoint &&
        dispatch(
          trackUnifiedSwapBridgeEvent(UnifiedSwapBridgeEventName.PageViewed, {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            feature_id: FeatureId.UNIFIED_SWAP_BRIDGE,
            // @ts-expect-error once @metamask/bridge-controller is updated
            environment_type: getEnvironmentType(), // eslint-disable-line @typescript-eslint/naming-convention
          }),
        );
      navigate(
        {
          pathname: `${CROSS_CHAIN_SWAP_ROUTE}${PREPARE_SWAP_ROUTE}`,
          search: searchParams.toString(),
        },
        {
          state: {
            ...state,
            token,
            ...clearSendBundleIfPresent(state),
          },
          replace: !isEntrypoint,
        },
      );
    },
    [dispatch, navigate, state],
  );

  /**
   * Navigates to the asset page for the given asset.
   * @param asset - The asset to display on the asset page.
   */
  const navigateToAssetPage = useCallback(
    (asset: BridgeToken) => {
      // Parse the CAIP assetId to get the address
      const { assetReference } = parseCaipAssetType(asset.assetId);
      const isNonEvm = isNonEvmChainId(asset.chainId);
      // For EVM: convert CAIP chainId to hex format; for non-EVM: keep CAIP format
      const routeChainId = isNonEvm
        ? asset.chainId
        : formatChainIdToHex(asset.chainId);
      // For EVM: convert assetReference to address; for non-EVM: use CAIP assetId
      const tokenAddress = isNonEvm
        ? asset.assetId
        : formatAddressToCaipReference(assetReference);
      const isNative = isNativeAddress(
        isNonEvm ? assetReference : tokenAddress,
      );

      navigate(buildAssetRoutePath(asset.assetId), {
        state: {
          ...state,
          bridgeState,
          token: {
            type: isNative ? AssetType.native : AssetType.token,
            assetId: asset.assetId,
            address: tokenAddress,
            symbol: asset.symbol,
            name: asset.name ?? asset.symbol,
            chainId: routeChainId,
            image: asset.iconUrl,
            isNative,
            decimals: asset.decimals,
          },
        },
      });
    },
    [navigate, state, bridgeState],
  );

  /**
   * Navigates to the hw transaction signing page.
   */
  const navigateToHwSigningPage = useCallback(
    (nextState: Partial<BridgeNavigationOptions['state']> = {}) => {
      const hasSendBundleState = Object.hasOwn(nextState, 'sendBundle');
      navigate(`${CROSS_CHAIN_SWAP_ROUTE}${HARDWARE_WALLET_SIGNATURES_ROUTE}`, {
        // For the sendBundle (send) flow, the signing page replaces the
        // /confirm-transaction entry so that cancelling returns the user
        // cleanly to the send flow (and back-button -> home) instead of
        // leaving a stale confirmation entry in the history stack.
        ...(hasSendBundleState ? { replace: true } : {}),
        state: {
          ...state,
          ...clearSendBundleIfPresent(state),
          ...nextState,
        },
      });
    },
    [navigate, state],
  );

  /**
   * Navigates to the activity page and clears the navigation state.
   */
  const navigateToActivityPage = useCallback(() => {
    navigate(`${DEFAULT_ROUTE}?tab=activity`, {
      state: clearedBridgeState(state, true),
      replace: true,
    });
  }, [navigate, state]);

  const navigateToDefaultRoute = useCallback(async () => {
    dispatch(resetBridgeController());
    const isFromTransactionShield = new URLSearchParams(search || '').get(
      BridgeQueryParams.IsFromTransactionShield,
    );
    if (isFromTransactionShield) {
      resetLocationState(TRANSACTION_SHIELD_ROUTE);
    } else {
      resetLocationState(DEFAULT_ROUTE, true);
    }
  }, [dispatch, search, resetLocationState]);

  const memoizedToken = useMemo(() => state.token, [state.token]);
  const memoizedBridgeState = useMemo(
    () => state.bridgeState,
    [state.bridgeState],
  );

  return {
    bridgeState: memoizedBridgeState,
    /**
     * The token propagated through the bridge navigation state when the Swap button is clicked
     * from the asset page
     */
    token: memoizedToken,
    search,
    resetLocationState,
    resetSearchParams,
    navigateToAssetPage,
    navigateToBridgePage,
    navigateToHwSigningPage,
    navigateToActivityPage,
    navigateToDefaultRoute,
  };
};
