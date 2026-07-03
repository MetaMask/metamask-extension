/**
 * Temporary extension-shell styling helpers for pure-black (OLED) dark mode.
 *
 * Remove once legacy extension surfaces are migrated to MMDS components and
 * tokens resolve elevated surfaces without JS branching (TMCU-622, TMCU-637).
 */

/**
 * Legacy app modal chrome border: muted on pure black to avoid harsh edges on #000.
 * @param isPureBlack
 */
export function getExtensionModalBorderColor(isPureBlack: boolean): string {
  return isPureBlack
    ? 'var(--color-border-muted)'
    : 'var(--color-border-default)';
}

/**
 * Multichain page frame: drop bordered elevation on pure-black (#000) backgrounds.
 * @param isPureBlack
 */
export function getPureBlackPageInnerContainerClassName(
  isPureBlack: boolean,
): string | false {
  return isPureBlack && '!border-0';
}

/**
 * Legacy component-library modal dialog: elevated surface (#0d0d0f) on pure black.
 * @param isPureBlack
 */
export function getModalContentDialogClassName(
  isPureBlack: boolean,
): string | false {
  return isPureBlack && 'bg-background-alternative';
}
