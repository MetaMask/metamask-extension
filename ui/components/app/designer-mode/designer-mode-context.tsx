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
  originalSnapshot: null,
  editLog: [],
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
          originalSnapshot: null,
          editLog: [],
        };
      }

      // Lock selection to this element
      const elementInfo = extractElementInfo(element);

      // Capture a snapshot of current styles and text for changeset tracking
      const styles: Record<string, string> = {};
      for (const category of Object.values(elementInfo.styles)) {
        for (const style of category) {
          styles[style.property] = style.value;
        }
      }
      const textContent = Array.from(element.childNodes)
        .filter((node) => node.nodeType === Node.TEXT_NODE)
        .map((node) => node.textContent || '')
        .join('')
        .trim();

      return {
        ...prev,
        isLocked: true,
        selectedElement: elementInfo,
        hoveredElement: elementInfo,
        originalSnapshot: { styles, textContent },
        editLog: [],
      };
    });
  }, []);

  const clearSelection = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isLocked: false,
      selectedElement: null,
      originalSnapshot: null,
      editLog: [],
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
      console.info('[Designer Mode] Element info copied to clipboard');
    } catch (error) {
      console.error('[Designer Mode] Failed to copy to clipboard:', error);
    }
  }, [state.selectedElement, state.hoveredElement]);

  const applyStyleChange = useCallback(
    (property: string, value: string) => {
      const elementInfo = state.selectedElement || state.hoveredElement;
      if (!elementInfo?.element) {
        return;
      }

      // Special log-only entries (class/token changes handled by the panel)
      const isLogOnly = property.startsWith('__');

      if (!isLogOnly) {
        // Convert kebab-case to camelCase and apply the change
        const camelProperty = property.replace(
          /-([a-z])/gu,
          (_, c: string) => c.toUpperCase(),
        );
        (elementInfo.element.style as unknown as Record<string, string>)[
          camelProperty
        ] = value;
      }

      // Build log entry
      const logEntry = isLogOnly
        ? value // For log-only entries, value IS the log message
        : `${property}: ${state.originalSnapshot?.styles[property] ?? '(unset)'} → ${value}`;

      // Re-extract element info to update the panel
      const updatedInfo = extractElementInfo(elementInfo.element);
      setState((prev) => {
        // For CSS properties, deduplicate by property name
        // For log-only entries, always append
        const filteredLog = isLogOnly
          ? prev.editLog
          : prev.editLog.filter(
              (entry) => !entry.startsWith(`${property}:`),
            );
        return {
          ...prev,
          editLog: [...filteredLog, logEntry],
          ...(prev.isLocked
            ? { selectedElement: updatedInfo, hoveredElement: updatedInfo }
            : { hoveredElement: updatedInfo }),
        };
      });
    },
    [state.selectedElement, state.hoveredElement],
  );

  const applyTextChange = useCallback(
    (text: string) => {
      const elementInfo = state.selectedElement || state.hoveredElement;
      if (!elementInfo?.element) {
        return;
      }

      // Use original snapshot for the "from" value
      const oldText = state.originalSnapshot?.textContent ?? '';

      // Find the first text node and change it, or set textContent
      const textNode = Array.from(elementInfo.element.childNodes).find(
        (node) => node.nodeType === Node.TEXT_NODE,
      );
      if (textNode) {
        textNode.textContent = text;
      } else {
        elementInfo.element.textContent = text;
      }

      // Record the edit
      const logEntry = `text: "${oldText}" → "${text}"`;

      // Re-extract element info
      const updatedInfo = extractElementInfo(elementInfo.element);
      setState((prev) => {
        const filteredLog = prev.editLog.filter(
          (entry) => !entry.startsWith('text:'),
        );
        return {
          ...prev,
          editLog: [...filteredLog, logEntry],
          ...(prev.isLocked
            ? { selectedElement: updatedInfo, hoveredElement: updatedInfo }
            : { hoveredElement: updatedInfo }),
        };
      });
    },
    [state.selectedElement, state.hoveredElement],
  );

  const clearEditLog = useCallback(() => {
    setState((prev) => ({ ...prev, editLog: [] }));
  }, []);

  // Keyboard shortcut: Ctrl/Cmd + Shift + D to toggle
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't intercept keyboard events when user is typing in an input
      const target = event.target as HTMLElement;
      const isTyping =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Ctrl+Shift+D or Cmd+Shift+D to toggle designer mode (always works)
      if (
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.key.toLowerCase() === 'd'
      ) {
        event.preventDefault();
        toggleDesignerMode();
        return;
      }

      // Skip remaining shortcuts when user is typing in a form field
      if (isTyping) {
        return;
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
      applyStyleChange,
      applyTextChange,
      clearEditLog,
    }),
    [
      state,
      toggleDesignerMode,
      setHoveredElement,
      toggleSelection,
      clearSelection,
      copyToClipboard,
      applyStyleChange,
      applyTextChange,
      clearEditLog,
    ],
  );

  return (
    <DesignerModeContext.Provider value={value}>
      {children}
    </DesignerModeContext.Provider>
  );
}
