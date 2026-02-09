/**
 * Utilities for extracting element information in Designer Mode
 */

import type {
  ElementInfo,
  ElementSnapshot,
  ComponentInfo,
  ComputedStyleInfo,
  DesignTokenInfo,
  AIFriendlyElementInfo,
} from './designer-mode.types';

// Design token patterns to detect from class names
const DESIGN_TOKEN_PATTERNS = {
  // Background colors
  backgroundColor: /^mm-box--background-color-(.+)$/,
  // Text colors
  textColor: /^mm-box--color-(.+)$/,
  // Typography
  textVariant: /^mm-text--(.+)$/,
  // Border radius
  borderRadius: /^mm-box--border-radius-(.+)$/,
  // Display
  display: /^mm-box--display-(.+)$/,
  // Flex
  flexDirection: /^mm-box--flex-direction-(.+)$/,
  alignItems: /^mm-box--align-items-(.+)$/,
  justifyContent: /^mm-box--justify-content-(.+)$/,
  // Spacing (padding/margin)
  padding: /^mm-box--padding-(.+)$/,
  margin: /^mm-box--margin-(.+)$/,
  gap: /^mm-box--gap-(.+)$/,
  // Width/Height
  width: /^mm-box--width-(.+)$/,
  height: /^mm-box--height-(.+)$/,
};

/**
 * Extract design tokens from CSS class names
 */
export function extractDesignTokensFromClasses(
  classNames: string[],
): DesignTokenInfo[] {
  const tokens: DesignTokenInfo[] = [];

  for (const className of classNames) {
    for (const [property, pattern] of Object.entries(DESIGN_TOKEN_PATTERNS)) {
      const match = className.match(pattern);
      if (match) {
        const tokenValue = match[1];
        let category: DesignTokenInfo['category'] = 'other';

        if (property.includes('Color') || property === 'textColor') {
          category = 'color';
        } else if (property.includes('text') || property === 'textVariant') {
          category = 'typography';
        } else if (
          property.includes('padding') ||
          property.includes('margin') ||
          property.includes('gap')
        ) {
          category = 'spacing';
        } else if (property.includes('borderRadius')) {
          category = 'borderRadius';
        }

        tokens.push({
          token: `${property}: ${tokenValue}`,
          category,
          value: tokenValue,
        });
        break;
      }
    }
  }

  return tokens;
}

/**
 * Get React fiber from DOM element (for component name extraction)
 */
function getReactFiber(element: HTMLElement): unknown | null {
  // React 17+ uses __reactFiber$ prefix
  const fiberKey = Object.keys(element).find(
    (key) =>
      key.startsWith('__reactFiber$') || key.startsWith('__reactInternalInstance$'),
  );

  if (fiberKey) {
    return (element as unknown as Record<string, unknown>)[fiberKey];
  }
  return null;
}

/**
 * Extract component name from React fiber
 */
function getComponentName(fiber: unknown): string | null {
  if (!fiber || typeof fiber !== 'object') {
    return null;
  }

  const fiberObj = fiber as Record<string, unknown>;
  const type = fiberObj.type;

  if (typeof type === 'string') {
    // Native element like 'div', 'button'
    return type;
  }

  if (typeof type === 'function') {
    // Function component or class component
    return (type as { displayName?: string; name?: string }).displayName ||
      (type as { name?: string }).name ||
      'UnknownComponent';
  }

  if (type && typeof type === 'object') {
    // Forward ref or memo component
    const typeObj = type as Record<string, unknown>;
    if (typeObj.displayName) {
      return typeObj.displayName as string;
    }
    if (typeObj.render && typeof typeObj.render === 'function') {
      const render = typeObj.render as { displayName?: string; name?: string };
      return render.displayName || render.name || 'ForwardRef';
    }
  }

  return null;
}

/**
 * Walk up the fiber tree to get component path
 */
function getComponentPath(fiber: unknown): string[] {
  const path: string[] = [];
  let current = fiber;

  while (current && typeof current === 'object') {
    const currentObj = current as Record<string, unknown>;
    const name = getComponentName(current);
    if (name && !name.match(/^(div|span|button|a|p|h[1-6]|ul|li|input|form)$/)) {
      path.unshift(name);
    }
    current = currentObj.return;

    // Limit depth to prevent infinite loops
    if (path.length > 20) {
      break;
    }
  }

  return path;
}

/**
 * Extract serializable props from fiber
 */
function extractSerializableProps(fiber: unknown): Record<string, unknown> {
  if (!fiber || typeof fiber !== 'object') {
    return {};
  }

  const fiberObj = fiber as Record<string, unknown>;
  const pendingProps = fiberObj.pendingProps as Record<string, unknown> | undefined;

  if (!pendingProps || typeof pendingProps !== 'object') {
    return {};
  }

  const serializableProps: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(pendingProps)) {
    // Skip children, functions, and React elements
    if (key === 'children') {
      continue;
    }
    if (typeof value === 'function') {
      serializableProps[key] = '[Function]';
      continue;
    }
    if (value && typeof value === 'object' && '$$typeof' in value) {
      serializableProps[key] = '[ReactElement]';
      continue;
    }

    // Include primitives and simple objects
    try {
      JSON.stringify(value);
      serializableProps[key] = value;
    } catch {
      serializableProps[key] = '[Complex Object]';
    }
  }

  return serializableProps;
}

/**
 * Extract component information from a DOM element
 */
export function extractComponentInfo(element: HTMLElement): ComponentInfo {
  const fiber = getReactFiber(element);
  const componentName = fiber ? getComponentName(fiber) : element.tagName.toLowerCase();
  const componentPath = fiber ? getComponentPath(fiber) : [];
  const props = fiber ? extractSerializableProps(fiber) : {};

  return {
    componentName,
    props,
    testId: element.getAttribute('data-testid'),
    classNames: Array.from(element.classList),
  };
}

/**
 * Categorize computed style property
 */
function categorizeStyleProperty(
  property: string,
): keyof ElementInfo['styles'] {
  const layoutProps = [
    'display',
    'flex',
    'flex-direction',
    'flex-wrap',
    'flex-grow',
    'flex-shrink',
    'flex-basis',
    'align-items',
    'justify-content',
    'gap',
    'grid',
    'position',
    'top',
    'right',
    'bottom',
    'left',
    'z-index',
    'overflow',
    'width',
    'height',
    'min-width',
    'max-width',
    'min-height',
    'max-height',
  ];

  const typographyProps = [
    'font-family',
    'font-size',
    'font-weight',
    'font-style',
    'line-height',
    'letter-spacing',
    'text-align',
    'text-decoration',
    'text-transform',
    'white-space',
    'word-break',
    'word-wrap',
  ];

  const colorProps = [
    'color',
    'background-color',
    'background',
    'opacity',
  ];

  const spacingProps = [
    'padding',
    'padding-top',
    'padding-right',
    'padding-bottom',
    'padding-left',
    'margin',
    'margin-top',
    'margin-right',
    'margin-bottom',
    'margin-left',
  ];

  const borderProps = [
    'border',
    'border-width',
    'border-style',
    'border-color',
    'border-radius',
    'border-top',
    'border-right',
    'border-bottom',
    'border-left',
    'box-shadow',
    'outline',
  ];

  if (layoutProps.some((p) => property.startsWith(p))) {
    return 'layout';
  }
  if (typographyProps.some((p) => property.startsWith(p))) {
    return 'typography';
  }
  if (colorProps.some((p) => property.startsWith(p))) {
    return 'colors';
  }
  if (spacingProps.some((p) => property.startsWith(p))) {
    return 'spacing';
  }
  if (borderProps.some((p) => property.startsWith(p))) {
    return 'borders';
  }

  return 'other';
}

/**
 * Extract relevant computed styles from an element
 */
export function extractComputedStyles(
  element: HTMLElement,
): ElementInfo['styles'] {
  const styles: ElementInfo['styles'] = {
    layout: [],
    typography: [],
    colors: [],
    spacing: [],
    borders: [],
    other: [],
  };

  const computedStyle = window.getComputedStyle(element);

  // Key properties to extract (not all 300+ CSS properties)
  const relevantProperties = [
    // Layout
    'display',
    'flex-direction',
    'flex-wrap',
    'align-items',
    'justify-content',
    'gap',
    'position',
    'width',
    'height',
    'min-width',
    'max-width',
    'overflow',
    // Typography
    'font-family',
    'font-size',
    'font-weight',
    'line-height',
    'text-align',
    'color',
    // Colors
    'background-color',
    'opacity',
    // Spacing
    'padding',
    'padding-top',
    'padding-right',
    'padding-bottom',
    'padding-left',
    'margin',
    'margin-top',
    'margin-right',
    'margin-bottom',
    'margin-left',
    // Borders
    'border',
    'border-radius',
    'box-shadow',
  ];

  for (const property of relevantProperties) {
    const value = computedStyle.getPropertyValue(property);
    if (value && value !== 'none' && value !== 'normal' && value !== 'auto') {
      const category = categorizeStyleProperty(property);
      styles[category].push({
        property,
        value,
      });
    }
  }

  return styles;
}

/**
 * Extract complete element information
 */
export function extractElementInfo(element: HTMLElement): ElementInfo {
  const component = extractComponentInfo(element);
  const fiber = getReactFiber(element);
  const componentPath = fiber ? getComponentPath(fiber) : [];

  return {
    element,
    component,
    styles: extractComputedStyles(element),
    boundingRect: element.getBoundingClientRect(),
    componentPath,
  };
}

/**
 * Convert ElementInfo to AI-friendly format for clipboard
 */
export function toAIFriendlyFormat(info: ElementInfo): AIFriendlyElementInfo {
  const designTokens = extractDesignTokensFromClasses(info.component.classNames);

  // Convert style arrays to objects
  const stylesToObject = (styles: ComputedStyleInfo[]): Record<string, string> => {
    return styles.reduce(
      (acc, { property, value }) => {
        acc[property] = value;
        return acc;
      },
      {} as Record<string, string>,
    );
  };

  return {
    summary: `${info.component.componentName || 'Unknown'} component at path: ${info.componentPath.join(' > ') || 'root'}`,
    component: {
      name: info.component.componentName,
      path: info.componentPath.join(' > '),
      props: info.component.props,
      testId: info.component.testId,
    },
    designSystem: {
      classNames: info.component.classNames,
      designTokens,
    },
    styles: {
      layout: stylesToObject(info.styles.layout),
      typography: stylesToObject(info.styles.typography),
      colors: stylesToObject(info.styles.colors),
      spacing: stylesToObject(info.styles.spacing),
      borders: stylesToObject(info.styles.borders),
    },
    suggestedChangesFormat: `
To modify this element, you can:
1. Change design tokens via className props (e.g., backgroundColor={BackgroundColor.primaryDefault})
2. Modify component props directly
3. Update the component's styles

Example change request:
"Change the background color to primary-default and increase padding to 4"
`.trim(),
  };
}

/**
 * Format element info for clipboard copy
 */
export function formatForClipboard(info: ElementInfo): string {
  const aiFormat = toAIFriendlyFormat(info);

  return `# MetaMask UI Element Inspector

## Summary
${aiFormat.summary}

## Component
- **Name**: ${aiFormat.component.name || 'Unknown'}
- **Path**: ${aiFormat.component.path || 'N/A'}
- **Test ID**: ${aiFormat.component.testId || 'None'}

## Props
\`\`\`json
${JSON.stringify(aiFormat.component.props, null, 2)}
\`\`\`

## Design System Classes
\`\`\`
${aiFormat.designSystem.classNames.join('\n') || 'None'}
\`\`\`

## Design Tokens Detected
${aiFormat.designSystem.designTokens.map((t) => `- ${t.token} (${t.category})`).join('\n') || 'None detected'}

## Computed Styles

### Layout
${Object.entries(aiFormat.styles.layout).map(([k, v]) => `- ${k}: ${v}`).join('\n') || 'None'}

### Typography
${Object.entries(aiFormat.styles.typography).map(([k, v]) => `- ${k}: ${v}`).join('\n') || 'None'}

### Colors
${Object.entries(aiFormat.styles.colors).map(([k, v]) => `- ${k}: ${v}`).join('\n') || 'None'}

### Spacing
${Object.entries(aiFormat.styles.spacing).map(([k, v]) => `- ${k}: ${v}`).join('\n') || 'None'}

### Borders
${Object.entries(aiFormat.styles.borders).map(([k, v]) => `- ${k}: ${v}`).join('\n') || 'None'}

---
${aiFormat.suggestedChangesFormat}
`;
}

/**
 * Compute style changes between the original snapshot and the current element
 */
function computeStyleChanges(
  originalSnapshot: ElementSnapshot,
  currentInfo: ElementInfo,
  editedProperties?: Set<string>,
): Array<{ property: string; from: string; to: string }> {
  const changes: Array<{ property: string; from: string; to: string }> = [];

  for (const category of Object.values(currentInfo.styles)) {
    for (const style of category) {
      // If editedProperties is provided, only include explicitly edited props
      if (editedProperties && !editedProperties.has(style.property)) {
        continue;
      }
      const originalValue = originalSnapshot.styles[style.property];
      if (originalValue && originalValue !== style.value) {
        changes.push({
          property: style.property,
          from: originalValue,
          to: style.value,
        });
      }
    }
  }

  return changes;
}

/**
 * Get the direct text content of an element (excluding children's text)
 */
export function getDirectTextContent(element: HTMLElement): string {
  return Array.from(element.childNodes)
    .filter((node) => node.nodeType === Node.TEXT_NODE)
    .map((node) => node.textContent || '')
    .join('')
    .trim();
}

/**
 * Format a structured prompt for an AI agent.
 * Includes element info, changeset from inline edits, and the designer's message.
 */
export function formatAgentPrompt(
  elementInfo: ElementInfo,
  _originalSnapshot: ElementSnapshot | null,
  designerMessage: string,
  editLog?: string[],
): string {
  const designTokens = extractDesignTokensFromClasses(
    elementInfo.component.classNames,
  );

  // Build the prompt
  const sections: string[] = [];

  // Instructions
  sections.push(`# Designer Mode Request

## Instructions for AI Agent
Apply the changes described below to the **source code**. The designer is
watching via hot reload and will see your changes live.

**After applying changes, you MUST do both:**
1. Send a response to the designer panel:
   \`curl -s -X POST http://localhost:3334/api/response -H "Content-Type: text/plain" -d "Done — <brief summary of what you changed>"\`
2. Run \`yarn designer-wait\` again to receive the next request.`);

  // Element info
  sections.push(`## Selected Element
- **Component**: ${elementInfo.component.componentName || 'Unknown'}
- **Path**: ${elementInfo.componentPath.join(' > ') || 'N/A'}
- **Test ID**: ${elementInfo.component.testId || 'None'}
- **Classes**: ${elementInfo.component.classNames.join(', ') || 'None'}`);

  // Design tokens
  if (designTokens.length > 0) {
    sections.push(`## Design Tokens
${designTokens.map((t) => `- ${t.token} (${t.category})`).join('\n')}`);
  }

  // Props
  const propsStr = JSON.stringify(elementInfo.component.props, null, 2);
  if (propsStr !== '{}') {
    sections.push(`## Component Props
\`\`\`json
${propsStr}
\`\`\``);
  }

  // Inline edits the designer made
  if (editLog && editLog.length > 0) {
    sections.push(`## Changes Made by Designer (apply these to source)
${editLog.map((entry) => `- ${entry}`).join('\n')}`);
  }

  // Current computed styles (for reference)
  const aiFormat = toAIFriendlyFormat(elementInfo);
  sections.push(`## Current Computed Styles (for reference)

### Layout
${Object.entries(aiFormat.styles.layout).map(([k, v]) => `- ${k}: ${v}`).join('\n') || 'None'}

### Typography
${Object.entries(aiFormat.styles.typography).map(([k, v]) => `- ${k}: ${v}`).join('\n') || 'None'}

### Colors
${Object.entries(aiFormat.styles.colors).map(([k, v]) => `- ${k}: ${v}`).join('\n') || 'None'}

### Spacing
${Object.entries(aiFormat.styles.spacing).map(([k, v]) => `- ${k}: ${v}`).join('\n') || 'None'}

### Borders
${Object.entries(aiFormat.styles.borders).map(([k, v]) => `- ${k}: ${v}`).join('\n') || 'None'}`);

  // Designer's message
  sections.push(`## Designer's Message
> ${designerMessage}`);

  return sections.join('\n\n');
}
