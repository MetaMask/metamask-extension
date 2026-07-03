import React from 'react';
import { PureBlackProvider } from '@metamask/design-system-react';
import { ThemeType } from '../../../shared/constants/preferences';
import { useTheme } from '../../hooks/useTheme';

/**
 * Applies MMDS pure-black (OLED) dark mode when the resolved theme is dark.
 *
 * Document tokens are also synced on `<html>` via `setTheme` in routes utils
 * (`data-theme` + `data-pure-black`).
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

  return (
    <PureBlackProvider isPureBlack={theme === ThemeType.dark}>
      {children}
    </PureBlackProvider>
  );
};
