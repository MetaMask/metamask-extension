import { memo, useCallback, useEffect, useMemo } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import { selectIsNetworkMenuOpen } from '../../selectors';
import { toggleNetworkMenu } from '../../store/actions';
import {
  DEEP_LINK_ORIGIN,
  HomeQueryParams,
} from '../../../shared/lib/deep-links/routes/home';

export type HomeDeepLinkQrCode = {
  deeplinkUrl: string;
  descriptionKey: string;
  titleKey: string;
};

type HomeDeepLinkActionsProps = {
  onQrCodeDeepLink?: (qrCode: HomeDeepLinkQrCode) => void;
};

function isDeepLinkUrlForPath(urlString: string | undefined, pathname: string) {
  if (!urlString) {
    return false;
  }

  try {
    const url = new URL(urlString);
    return url.origin === DEEP_LINK_ORIGIN && url.pathname === pathname;
  } catch {
    return false;
  }
}

/**
 * Reusable hook to handle deep link actions for the home route.
 * @param options0
 * @param options0.onQrCodeDeepLink
 */
export const useHomeDeepLinkEffects = ({
  onQrCodeDeepLink,
}: HomeDeepLinkActionsProps = {}) => {
  const { pathname } = useLocation();
  const isHomeRoute = pathname === DEFAULT_ROUTE;

  const [searchParams, setSearchParams] = useSearchParams();
  const isNetworkMenuOpen = useSelector(selectIsNetworkMenuOpen);
  const dispatch = useDispatch();

  const openNetworkSelectorModal = useCallback(() => {
    if (!isNetworkMenuOpen) {
      dispatch(toggleNetworkMenu());
    }
  }, [dispatch, isNetworkMenuOpen]);

  const openPredictQrCodeModal = useCallback(
    (deeplinkUrl: string) => {
      onQrCodeDeepLink?.({
        deeplinkUrl,
        descriptionKey: 'deepLinkQrPredictDescription',
        titleKey: 'deepLinkQrPredictTitle',
      });
    },
    [onQrCodeDeepLink],
  );

  const deepLinkHandlers: Record<
    HomeQueryParams,
    {
      isValidParam: (param?: string) => boolean;
      action: (param: string) => void;
    }
  > = useMemo(
    () => ({
      [HomeQueryParams.OpenNetworkSelector]: {
        isValidParam: (param?: string) => param?.toLowerCase() === 'true',
        action: openNetworkSelectorModal,
      },
      [HomeQueryParams.PredictDeeplinkUrl]: {
        isValidParam: (param?: string) =>
          isDeepLinkUrlForPath(param, '/predict'),
        action: openPredictQrCodeModal,
      },
    }),
    [openNetworkSelectorModal, openPredictQrCodeModal],
  );

  const clearDeepLinkParams = useCallback(() => {
    setSearchParams((params) => {
      Object.keys(deepLinkHandlers).forEach((key) => {
        params.delete(key);
      });
      return params;
    });
  }, [setSearchParams, deepLinkHandlers]);

  const handleDeepLinkAction = useCallback(
    (action: (param: string) => void, param: string) => {
      action(param);
      clearDeepLinkParams();
    },
    [clearDeepLinkParams],
  );

  useEffect(() => {
    if (!isHomeRoute) {
      return;
    }

    for (const [key, value] of searchParams.entries()) {
      const deepLink = deepLinkHandlers[key as HomeQueryParams];
      if (deepLink?.isValidParam(value)) {
        handleDeepLinkAction(deepLink.action, value);
        break;
      }
    }
  }, [deepLinkHandlers, handleDeepLinkAction, isHomeRoute, searchParams]);
};

/**
 * Ghost component that manages the useHomeDeepLinkEffects
 * Can be used in non-functional components (that cannot use hooks)
 */
export const HomeDeepLinkActions = memo(
  ({ onQrCodeDeepLink }: HomeDeepLinkActionsProps) => {
    useHomeDeepLinkEffects({ onQrCodeDeepLink });
    return null;
  },
);
