/**
 * Designer Mode Context Provider
 * Provides state and actions for the Designer Mode feature
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import type {
  DesignerModeContextValue,
  DesignerModeState,
} from './designer-mode.types';
import { extractElementInfo, formatForClipboard } from './designer-mode.utils';

const DESIGNER_MODE_ENABLED_KEY = 'metamask-designer-mode-enabled';

const initialState: DesignerModeState = {
  isActive: false,
  hoveredElement: null,
  selectedElement: null,
  isLocked: false,
};

const DesignerModeContext = createContext<DesignerModeContextValue | null>(
  null,
);

/**
 * Check if designer mode is enabled in settings (localStorage)
 */
export function getDesignerModeEnabled(): boolean {
  try {
    return localStorage.getItem(DESIGNER_MODE_ENABLED_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Set whether designer mode is enabled in settings
 */
export function setDesignerModeEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(DESIGNER_MODE_ENABLED_KEY, String(enabled));
    // Dispatch a custom event so components can react to the change
    window.dispatchEvent(
      new CustomEvent('designer-mode-enabled-changed', { detail: enabled }),
    );
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Hook to get and react to designer mode enabled state from settings
 */
export function useDesignerModeEnabled(): boolean {
  const [isEnabled, setIsEnabled] = useState(getDesignerModeEnabled);

  useEffect(() => {
    const handleChange = (event: CustomEvent<boolean>) => {
      setIsEnabled(event.detail);
    };

    window.addEventListener(
      'designer-mode-enabled-changed',
      handleChange as EventListener,
    );
    return () => {
      window.removeEventListener(
        'designer-mode-enabled-changed',
        handleChange as EventListener,
      );
    };
  }, []);

  return isEnabled;
}

export function useDesignerMode(): DesignerModeContextValue {
  const context = useContext(DesignerModeContext);
  if (!context) {
    throw new Error(
      'useDesignerMode must be used within a DesignerModeProvider',
    );
  }
  return context;
}

/**
 * Hook to safely access designer mode (returns null if not in provider)
 */
export function useDesignerModeOptional(): DesignerModeContextValue | null {
  return useContext(DesignerModeContext);
}

type DesignerModeProviderProps = {
  children: React.ReactNode;
};

export function DesignerModeProvider({ children }: DesignerModeProviderProps) {
  const [state, setState] = useState<DesignerModeState>(initialState);

  const toggleDesignerMode = useCallback(() => {
    setState((prev) => {
      if (prev.isActive) {
        // Deactivating - clear everything
        return {
          ...initialState,
          isActive: false,
        };
      }
      return {
        ...prev,
        isActive: true,
      };
    });
  }, []);

  const setHoveredElement = useCallback((element: HTMLElement | null) => {
    setState((prev) => {
      // Don't update if selection is locked
      if (prev.isLocked) {
        return prev;
      }

      if (!element) {
        return {
          ...prev,
          hoveredElement: null,
        };
      }

      const elementInfo = extractElementInfo(element);
      return {
        ...prev,
        hoveredElement: elementInfo,
      };
    });
  }, []);

  const toggleSelection = useCallback((element: HTMLElement) => {
    setState((prev) => {
      if (prev.isLocked && prev.selectedElement?.element === element) {
        // Clicking same element again - unlock
        return {
          ...prev,
          isLocked: false,
          selectedElement: null,
        };
      }

      // Lock selection to this element
      const elementInfo = extractElementInfo(element);
      return {
        ...prev,
        isLocked: true,
        selectedElement: elementInfo,
        hoveredElement: elementInfo,
      };
    });
  }, []);

  const clearSelection = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isLocked: false,
      selectedElement: null,
    }));
  }, []);

  const copyToClipboard = useCallback(async () => {
    const elementInfo = state.selectedElement || state.hoveredElement;
    if (!elementInfo) {
      return;
    }

    const formattedText = formatForClipboard(elementInfo);

    try {
      await navigator.clipboard.writeText(formattedText);
      // Could add a toast notification here
      console.info('[Designer Mode] Element info copied to clipboard');
    } catch (error) {
      console.error('[Designer Mode] Failed to copy to clipboard:', error);
    }
  }, [state.selectedElement, state.hoveredElement]);

  // Keyboard shortcut: Ctrl/Cmd + Shift + D to toggle
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Shift+D or Cmd+Shift+D to toggle designer mode
      if (
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.key.toLowerCase() === 'd'
      ) {
        event.preventDefault();
        toggleDesignerMode();
      }

      // Escape to clear selection or exit designer mode
      if (event.key === 'Escape' && state.isActive) {
        event.preventDefault();
        if (state.isLocked) {
          clearSelection();
        } else {
          toggleDesignerMode();
        }
      }

      // C to copy when in designer mode with selection
      if (
        event.key.toLowerCase() === 'c' &&
        state.isActive &&
        (state.selectedElement || state.hoveredElement) &&
        !event.ctrlKey &&
        !event.metaKey
      ) {
        event.preventDefault();
        copyToClipboard();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    state.isActive,
    state.isLocked,
    state.selectedElement,
    state.hoveredElement,
    toggleDesignerMode,
    clearSelection,
    copyToClipboard,
  ]);

  const value = useMemo<DesignerModeContextValue>(
    () => ({
      ...state,
      toggleDesignerMode,
      setHoveredElement,
      toggleSelection,
      clearSelection,
      copyToClipboard,
    }),
    [
      state,
      toggleDesignerMode,
      setHoveredElement,
      toggleSelection,
      clearSelection,
      copyToClipboard,
    ],
  );

  return (
    <DesignerModeContext.Provider value={value}>
      {children}
    </DesignerModeContext.Provider>
  );
}
