/**
 * Types for Designer Mode - a development tool for inspecting UI elements
 */

export type DesignTokenInfo = {
  /** The design token name (e.g., 'primary-default', 'body-md') */
  token: string;
  /** The category of the token (e.g., 'color', 'typography', 'spacing') */
  category: 'color' | 'typography' | 'spacing' | 'borderRadius' | 'other';
  /** The resolved CSS value */
  value: string;
};

export type ComputedStyleInfo = {
  /** CSS property name */
  property: string;
  /** CSS value */
  value: string;
  /** Whether this maps to a design token */
  designToken?: DesignTokenInfo;
};

export type ComponentInfo = {
  /** React component display name */
  componentName: string | null;
  /** Component props (serializable subset) */
  props: Record<string, unknown>;
  /** Data-testid if present */
  testId: string | null;
  /** CSS class names */
  classNames: string[];
};

export type ElementInfo = {
  /** The selected DOM element */
  element: HTMLElement;
  /** Component information extracted from React fiber */
  component: ComponentInfo;
  /** Computed styles organized by category */
  styles: {
    layout: ComputedStyleInfo[];
    typography: ComputedStyleInfo[];
    colors: ComputedStyleInfo[];
    spacing: ComputedStyleInfo[];
    borders: ComputedStyleInfo[];
    other: ComputedStyleInfo[];
  };
  /** Bounding rect of the element */
  boundingRect: DOMRect;
  /** Path to the element in the component tree */
  componentPath: string[];
};

export type DesignerModeState = {
  /** Whether designer mode is active */
  isActive: boolean;
  /** Currently hovered element info */
  hoveredElement: ElementInfo | null;
  /** Currently selected/locked element info */
  selectedElement: ElementInfo | null;
  /** Whether selection is locked (clicking locks, clicking again unlocks) */
  isLocked: boolean;
};

export type DesignerModeContextValue = DesignerModeState & {
  /** Toggle designer mode on/off */
  toggleDesignerMode: () => void;
  /** Set the hovered element */
  setHoveredElement: (element: HTMLElement | null) => void;
  /** Lock/unlock selection on an element */
  toggleSelection: (element: HTMLElement) => void;
  /** Clear the current selection */
  clearSelection: () => void;
  /** Copy element info to clipboard in AI-friendly format */
  copyToClipboard: () => Promise<void>;
};

export type AIFriendlyElementInfo = {
  /** Summary for quick understanding */
  summary: string;
  /** Component details */
  component: {
    name: string | null;
    path: string;
    props: Record<string, unknown>;
    testId: string | null;
  };
  /** Design system information */
  designSystem: {
    classNames: string[];
    designTokens: DesignTokenInfo[];
  };
  /** Computed styles by category */
  styles: {
    layout: Record<string, string>;
    typography: Record<string, string>;
    colors: Record<string, string>;
    spacing: Record<string, string>;
    borders: Record<string, string>;
  };
  /** Suggested changes format */
  suggestedChangesFormat: string;
};
