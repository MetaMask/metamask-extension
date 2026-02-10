import { FC, memo, useCallback, useEffect, useMemo } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import { selectIsNetworkMenuOpen } from '../../selectors';
import { toggleNetworkMenu } from '../../store/actions';
import { HomeQueryParams } from '../../../shared/lib/deep-links/routes/home';

/**
 * Reusable hook to handle deep link actions for the home route.
 */
export const useHomeDeepLinkEffects = () => {
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

  const deepLinkHandlers: Record<
    HomeQueryParams,
    { isValidParam: (param?: string) => boolean; action: () => void }
  > = useMemo(
    () => ({
      [HomeQueryParams.OpenNetworkSelector]: {
        isValidParam: (param?: string) => param?.toLowerCase() === 'true',
        action: openNetworkSelectorModal,
      },
    }),
    [openNetworkSelectorModal],
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
    (action: () => void) => {
      action();
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
        handleDeepLinkAction(deepLink.action);
        break;
      }
    }
  }, [deepLinkHandlers, handleDeepLinkAction, isHomeRoute, searchParams]);
};

/**
 * Ghost component that manages the useHomeDeepLinkEffects
 * Can be used in non-functional components (that cannot use hooks)
 */
export const HomeDeepLinkActions: FC = memo(() => {
  useHomeDeepLinkEffects();
  return null;
});
