import React from 'react';
import { PureBlackProvider } from '@metamask/design-system-react';
import { ThemeType } from '../../../shared/constants/preferences';
import { getIsPureBlackPreviewEnabled } from '../../../shared/lib/environment';
import { useTheme } from '../../hooks/useTheme';

/**
 * Preview-only root wrapper for the design-system pure-black token experiment.
 *
 * App-owned source of truth: compile-time `MM_PURE_BLACK_PREVIEW` (see `.metamaskrc`).
 * MMDS-owned read surface: import `usePureBlack()` from `@metamask/design-system-react`
 * anywhere you need to branch on whether pure black is actively rendering (e.g. custom
 * classNames on legacy screens). Do not add extension-specific read hooks for this.
 * @param options0
 * @param options0.children
 */
export const PreviewPureBlackProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const theme = useTheme();
  const isPureBlackActive =
    getIsPureBlackPreviewEnabled() && theme === ThemeType.dark;

  return (
    <PureBlackProvider isPureBlack={isPureBlackActive}>
      {children}
    </PureBlackProvider>
  );
};
