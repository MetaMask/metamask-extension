import { useEffect, useState } from 'react';
import { getEnvironmentType } from '../../../shared/lib/environment-type';
import {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_SIDEPANEL,
} from '../../../shared/constants/app';

const SIDEPANEL_COMPACT_SETTINGS_MAX_WIDTH = 575;

const useIsSidepanelCompactSettingsLayout = (isSidepanel: boolean) => {
  const [isCompact, setIsCompact] = useState(() =>
    isSidepanel && typeof window !== 'undefined'
      ? window.innerWidth <= SIDEPANEL_COMPACT_SETTINGS_MAX_WIDTH
      : false,
  );

  const [prevIsSidepanel, setPrevIsSidepanel] = useState(isSidepanel);
  if (isSidepanel !== prevIsSidepanel) {
    setPrevIsSidepanel(isSidepanel);
    setIsCompact(
      isSidepanel && typeof window !== 'undefined'
        ? window.innerWidth <= SIDEPANEL_COMPACT_SETTINGS_MAX_WIDTH
        : false,
    );
  }

  useEffect(() => {
    if (!isSidepanel) {
      return undefined;
    }

    const updateIsCompact = () => {
      setIsCompact(window.innerWidth <= SIDEPANEL_COMPACT_SETTINGS_MAX_WIDTH);
    };

    window.addEventListener('resize', updateIsCompact);

    return () => window.removeEventListener('resize', updateIsCompact);
  }, [isSidepanel]);

  return isCompact;
};

/**
 * Whether Settings uses the compact layout (popup or narrow sidepanel), where
 * the header shows a single page title instead of the fullscreen breadcrumbs.
 */
export const useIsCompactSettingsLayout = () => {
  const environmentType = getEnvironmentType();
  const isCompactSidepanel = useIsSidepanelCompactSettingsLayout(
    environmentType === ENVIRONMENT_TYPE_SIDEPANEL,
  );

  return environmentType === ENVIRONMENT_TYPE_POPUP || isCompactSidepanel;
};
