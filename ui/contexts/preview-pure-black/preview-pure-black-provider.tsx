import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { PureBlackProvider } from '@metamask/design-system-react';
import { ThemeType } from '../../../shared/constants/preferences';
import { useTheme } from '../../hooks/useTheme';

const PREVIEW_PURE_BLACK_STORAGE_KEY = 'metamask-preview-pure-black';

/**
 * Pure black preview is only available in local development builds (`yarn start`).
 */
export const isPureBlackPreviewAvailable = (): boolean =>
  process.env.METAMASK_DEBUG === 'true';

type PreviewPureBlackContextValue = {
  isPureBlackEnabled: boolean;
  setIsPureBlackEnabled: (enabled: boolean) => void;
};

const PreviewPureBlackContext =
  createContext<PreviewPureBlackContextValue | null>(null);

const readStoredPureBlackPreference = (): boolean => {
  try {
    return localStorage.getItem(PREVIEW_PURE_BLACK_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

export const PreviewPureBlackProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const theme = useTheme();
  const [isPureBlackEnabled, setIsPureBlackEnabledState] = useState(
    readStoredPureBlackPreference,
  );

  const setIsPureBlackEnabled = useCallback((enabled: boolean) => {
    setIsPureBlackEnabledState(enabled);
    try {
      localStorage.setItem(
        PREVIEW_PURE_BLACK_STORAGE_KEY,
        enabled ? 'true' : 'false',
      );
    } catch {
      // Ignore storage failures during preview testing.
    }
  }, []);

  const isPureBlackActive =
    isPureBlackPreviewAvailable() &&
    theme === ThemeType.dark &&
    isPureBlackEnabled;

  const contextValue = useMemo(
    () => ({
      isPureBlackEnabled,
      setIsPureBlackEnabled,
    }),
    [isPureBlackEnabled, setIsPureBlackEnabled],
  );

  return (
    <PreviewPureBlackContext.Provider value={contextValue}>
      <PureBlackProvider isPureBlack={isPureBlackActive}>
        {children}
      </PureBlackProvider>
    </PreviewPureBlackContext.Provider>
  );
};

export const usePreviewPureBlack = (): PreviewPureBlackContextValue => {
  const context = useContext(PreviewPureBlackContext);
  if (!context) {
    throw new Error(
      'usePreviewPureBlack must be used within PreviewPureBlackProvider',
    );
  }
  return context;
};
