import React from 'react';
import { PureBlackProvider } from '@metamask/design-system-react';
import { ThemeType } from '../../../shared/constants/preferences';
import { getIsPureBlackPreviewEnabled } from '../../../shared/lib/environment';
import { useTheme } from '../../hooks/useTheme';

/**
 * Applies MMDS pure-black (OLED) dark mode when the resolved theme is dark
 * and `MM_PURE_BLACK_PREVIEW` is enabled (via `.metamaskrc` for local dev, or
 * `builds.yml` to enable for all users).
 *
 * Document tokens are also synced on `<html>` via `setTheme` in routes utils
 * (`data-theme` + `data-pure-black`).
 *
 * NOTE: This provider is temporary. Once pure-black and dark theme tokens are
 * consolidated into a single token set, this component and its build-time flag
 * check should be removed. Tracked in TMCU-1083.
 *
 * @param options0
 * @param options0.children
 */
export const AppPureBlackProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const theme = useTheme();
  const isPureBlack =
    theme === ThemeType.dark && getIsPureBlackPreviewEnabled();

  return (
    <PureBlackProvider isPureBlack={isPureBlack}>{children}</PureBlackProvider>
  );
};
