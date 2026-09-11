import type { ComputedStyleSnapshot, ComponentInfo, Framework } from './types';

export type ComponentInfoFields = {
  componentName: string;
  filePath?: string | null;
  lineNumber?: number | null;
  props?: Record<string, string> | null;
  testId?: string | null;
  domPath?: string;
  extra?: Record<string, unknown>;
};

export function buildComponentInfo(
  el: HTMLElement,
  fields: ComponentInfoFields,
): ComponentInfo {
  return {
    componentName: fields.componentName,
    filePath: fields.filePath ?? null,
    lineNumber: fields.lineNumber ?? null,
    props: fields.props ?? null,
    testId:
      fields.testId === undefined
        ? (el.dataset.testid ?? el.getAttribute('data-testid') ?? null)
        : fields.testId,
    classes: Array.from(el.classList),
    computedStyles: extractComputedStyles(el),
    layoutRect: el.getBoundingClientRect(),
    textContent: getDirectTextContent(el),
    ...(fields.domPath ? { domPath: fields.domPath } : {}),
    ...(fields.extra ? { extra: fields.extra } : {}),
  };
}

export function buildFallbackInfo(el: HTMLElement): ComponentInfo {
  return buildComponentInfo(el, { componentName: el.tagName.toLowerCase() });
}

const FRAMEWORK_EXTENSIONS = /\.(vue|svelte|tsx?|jsx?|component\.ts)$/u;

export function extractComponentNameFromPath(
  filePath: string | null | undefined,
): string | null {
  if (!filePath) {
    return null;
  }
  const fileName = filePath.split('/').pop();
  if (!fileName) {
    return null;
  }
  return fileName.replace(FRAMEWORK_EXTENSIONS, '') || null;
}

const LAYOUT_PROPS = [
  'display',
  'position',
  'width',
  'height',
  'min-width',
  'max-width',
  'min-height',
  'max-height',
  'flex',
  'flex-direction',
  'flex-wrap',
  'align-items',
  'align-self',
  'justify-content',
  'gap',
  'overflow',
  'z-index',
  'top',
  'left',
  'right',
  'bottom',
  'box-sizing',
];
const TYPOGRAPHY_PROPS = [
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
];
const COLOR_PROPS = ['color', 'opacity'];
const SPACING_PROPS = [
  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'padding',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
];
const BORDER_PROPS = [
  'border',
  'border-width',
  'border-style',
  'border-color',
  'border-radius',
  'border-top-left-radius',
  'border-top-right-radius',
  'border-bottom-left-radius',
  'border-bottom-right-radius',
  'outline',
];
const EFFECTS_PROPS = [
  'background',
  'background-color',
  'box-shadow',
  'transform',
  'transition',
  'cursor',
];

export function extractComputedStyles(el: HTMLElement): ComputedStyleSnapshot {
  const cs = getComputedStyle(el);
  const get = (p: string) => cs.getPropertyValue(p).trim();
  const pick = (props: string[]) =>
    Object.fromEntries(
      props
        .map((p) => [p, get(p)])
        .filter(
          ([p, v]) =>
            (v &&
              v !== 'none' &&
              v !== 'normal' &&
              v !== '0px' &&
              v !== 'auto') ||
            ['display', 'position', 'width', 'height'].includes(p as string),
        ),
    );

  return {
    layout: pick(LAYOUT_PROPS),
    typography: pick(TYPOGRAPHY_PROPS),
    color: pick(COLOR_PROPS),
    spacing: pick(SPACING_PROPS),
    border: pick(BORDER_PROPS),
    effects: pick(EFFECTS_PROPS),
  };
}

export function buildDomPath(el: HTMLElement): string {
  const parts: string[] = [];
  let current: HTMLElement | null = el;
  while (current && current !== document.body) {
    const node: HTMLElement = current;
    let selector = node.tagName.toLowerCase();
    if (node.id) {
      parts.unshift(`#${node.id}`);
      break;
    }
    if (node.classList.length > 0) {
      selector += `.${Array.from(node.classList).slice(0, 2).join('.')}`;
    }
    const parent = node.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        (s) => s.tagName === node.tagName,
      );
      if (siblings.length > 1) {
        // The index is among same-tag siblings, which is :nth-of-type
        // semantics — :nth-child counts every child and would produce a
        // selector that doesn't match the node in mixed markup.
        selector += `:nth-of-type(${siblings.indexOf(node) + 1})`;
      }
    }
    parts.unshift(selector);
    current = node.parentElement;
  }
  return parts.join(' > ');
}

export function getDirectTextContent(el: HTMLElement): string | null {
  const text = Array.from(el.childNodes)
    .filter((n) => n.nodeType === Node.TEXT_NODE)
    .map((n) => n.textContent?.trim())
    .filter(Boolean)
    .join(' ');
  return text || null;
}

export function serializeProps(
  props: Record<string, unknown>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(props)
      .filter(([k]) => k !== 'children' && !k.startsWith('__'))
      .slice(0, 20)
      .map(([k, v]) => {
        if (v === null || v === undefined) {
          return [k, String(v)];
        }
        if (typeof v === 'function') {
          return [k, `fn:${(v as Function).name || 'anonymous'}`];
        }
        if (typeof v === 'boolean' || typeof v === 'number') {
          return [k, String(v)];
        }
        if (typeof v === 'string') {
          return [k, `"${v}"`];
        }
        if (v instanceof HTMLElement) {
          return [k, `<${v.tagName.toLowerCase()}>`];
        }
        if (Array.isArray(v)) {
          return [k, `Array(${v.length})`];
        }
        if (typeof v === 'object') {
          return [k, JSON.stringify(v).slice(0, 80)];
        }
        return [k, String(v)];
      }),
  );
}

export function detectFramework(): Promise<Framework> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const { body } = document;
      const child = body.firstElementChild as HTMLElement | null;
      if (child) {
        const keys = Object.keys(child);
        if (
          keys.some(
            (k) =>
              k.startsWith('__reactFiber$') ||
              k.startsWith('__reactInternalInstance$'),
          )
        ) {
          return resolve('react');
        }
      }
      // Framework globals use fixed, library-defined names; read them via bracket
      // access on an untyped record to avoid `any` and naming-convention churn.
      const win = window as unknown as Record<string, unknown>;
      const childGlobals = (child ?? {}) as Record<string, unknown>;
      const ng = win.ng as { getComponent?: unknown } | undefined;
      if (win.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        return resolve('react');
      }
      if (win.__VUE__ || childGlobals.__vueParentComponent) {
        return resolve('vue');
      }
      if (ng?.getComponent || document.querySelector('[ng-version]')) {
        return resolve('angular');
      }
      if (document.querySelector('[data-svelte-component]')) {
        return resolve('svelte');
      }
      resolve('vanilla');
    }, 150);
  });
}
