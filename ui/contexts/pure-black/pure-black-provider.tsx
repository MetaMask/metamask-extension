import React from 'react';
import { useSelector } from 'react-redux';
import { PureBlackProvider } from '@metamask/design-system-react';
import { ThemeType } from '../../../shared/constants/preferences';
import { getIsPureBlackPreviewEnabled } from '../../../shared/lib/environment';
import { useTheme } from '../../hooks/useTheme';
import { getIsPureBlackEnabled } from '../../selectors/theme/feature-flags';

/**
 * Applies MMDS pure-black (OLED) dark mode when the resolved theme is dark
 * and the `extensionUxPureBlack` remote feature flag is enabled (or
 * `MM_PURE_BLACK_PREVIEW` is set for local development).
 *
 * Document tokens are also synced on `<html>` via `setTheme` in routes utils
 * (`data-theme` + `data-pure-black`).
 *
 * NOTE: This provider is temporary. Once pure-black and dark theme tokens are
 * consolidated into a single token set, this component and its associated
 * feature flag wiring should be removed. Tracked in TMCU-1083.
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
  const isPureBlackEnabled = useSelector(getIsPureBlackEnabled);
  const isPureBlack =
    theme === ThemeType.dark &&
    (isPureBlackEnabled || getIsPureBlackPreviewEnabled());

  return (
    <PureBlackProvider isPureBlack={isPureBlack}>{children}</PureBlackProvider>
  );
};
