/**
 * Designer Mode
 * A development tool for inspecting UI elements and extracting their styles
 * for use with AI agents to iterate on designs.
 *
 * Usage:
 * - Press Ctrl+Shift+D (or Cmd+Shift+D on Mac) to toggle designer mode
 * - Hover over elements to see their component name and styles
 * - Click to lock selection
 * - Press C or click "Copy for AI" to copy element info to clipboard
 * - Press Escape to unlock selection or exit designer mode
 *
 * Enable in Settings > Developer Options > Designer Mode
 */

import React from 'react';
import { DesignerModeProvider, useDesignerModeEnabled } from './designer-mode-context';
import { DesignerModeOverlay } from './designer-mode-overlay';
import { DesignerModePanel } from './designer-mode-panel';
import { DesignerModeToggle } from './designer-mode-toggle';

type DesignerModeProps = {
  /** Whether to show the toggle button (defaults to true) */
  showToggle?: boolean;
  children: React.ReactNode;
};

/**
 * Inner component that checks if designer mode is enabled in settings
 */
function DesignerModeContent({ showToggle }: { showToggle: boolean }) {
  const isEnabled = useDesignerModeEnabled();

  if (!isEnabled) {
    return null;
  }

  return (
    <>
      <DesignerModeOverlay />
      <DesignerModePanel />
      {showToggle && <DesignerModeToggle />}
    </>
  );
}

/**
 * Designer Mode wrapper component
 * Wraps the app and provides designer mode functionality
 * Enable via Settings > Developer Options
 */
export function DesignerMode({ showToggle = true, children }: DesignerModeProps) {
  return (
    <DesignerModeProvider>
      {children}
      <DesignerModeContent showToggle={showToggle} />
    </DesignerModeProvider>
  );
}

export { DesignerModeProvider } from './designer-mode-context';
export {
  useDesignerMode,
  useDesignerModeOptional,
  useDesignerModeEnabled,
  getDesignerModeEnabled,
  setDesignerModeEnabled,
} from './designer-mode-context';
export { DesignerModeOverlay } from './designer-mode-overlay';
export { DesignerModePanel } from './designer-mode-panel';
export type {
  DesignerModeState,
  DesignerModeContextValue,
  ElementInfo,
  ComponentInfo,
  AIFriendlyElementInfo,
} from './designer-mode.types';
