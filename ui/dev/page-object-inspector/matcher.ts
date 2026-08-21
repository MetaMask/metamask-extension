import {
  CONFLICT_ATTRIBUTE,
  INSPECTOR_ROOT_ATTRIBUTE,
  OWNER_ATTRIBUTE,
  SELECTOR_ID_ATTRIBUTE,
  STAMP_ATTRIBUTES,
  VIEWPORT_ATTRIBUTE,
  type PageObject,
  type PageObjectIndex,
  type Selector,
} from './types';

export type StampResult = {
  /** Elements that ended up owned by at least one page object. */
  stamped: number;
  /** Elements claimed by two or more different page-object classes. */
  conflicts: number;
  /** Selectors that threw when run against the DOM. */
  failed: number;
  /** Selectors whose shape the matcher cannot execute, mostly dynamic XPath. */
  unsupported: number;
};

/**
 * Rewrites a dynamic selector's literal chunks into a CSS selector using
 * prefix and suffix attribute matching.
 *
 * `[data-testid="network-list-item-${name}"]` becomes
 * `[data-testid^="network-list-item-"]`, which is the closest thing CSS offers
 * to a pattern match. Shapes with a hole outside an attribute value, or with
 * more than one hole, have no CSS equivalent and are reported as unsupported.
 *
 * @param chunks - The literal fragments surrounding each hole.
 * @param kind
 * @returns A CSS selector, or null when the shape cannot be expressed.
 */
function dynamicCssFromChunks(
  chunks: string[],
  kind: Selector['kind'],
): string | null {
  if (chunks.length !== 2) {
    return null;
  }

  // A bare test id has no brackets around it in the source, so give it the
  // attribute wrapper the CSS rewrite below expects to find.
  const [before, after] =
    kind === 'testId'
      ? [`[data-testid="${chunks[0]}`, `${chunks[1]}"]`]
      : chunks;
  const attribute = before.match(/\[([\w-]+)="([^"]*)$/u);
  const closing = after.match(/^([^"]*)"\](.*)$/u);

  if (!attribute || !closing) {
    return null;
  }

  const [, name, prefix] = attribute;
  const [, suffix, trailing] = closing;
  const leading = before.slice(0, before.length - attribute[0].length);

  const constraints = [
    prefix === '' ? '' : `[${name}^="${prefix}"]`,
    suffix === '' ? '' : `[${name}$="${suffix}"]`,
  ].join('');

  return constraints === ''
    ? `${leading}[${name}]${trailing}`
    : `${leading}${constraints}${trailing}`;
}

/**
 * Builds the CSS selector that finds candidate elements for a selector, before
 * any text filtering is applied.
 *
 * @param selector - The selector to translate.
 * @returns A CSS selector, or null when the selector cannot be run as CSS.
 */
function cssFor(selector: Selector): string | null {
  if (selector.chunks) {
    return dynamicCssFromChunks(selector.chunks, selector.kind);
  }

  if (selector.kind === 'testId') {
    return `[data-testid="${selector.value}"]`;
  }

  if (selector.kind === 'css' || selector.kind === 'cssText') {
    return selector.value ?? null;
  }

  return null;
}

/**
 * Checks whether an element's text content contains the expected text.
 *
 * @param element - The DOM element to check.
 * @param text - The expected text substring.
 * @returns True when the element's text content includes the text.
 */
function elementContainsText(element: Element, text: string): boolean {
  const content = element.textContent?.trim() ?? '';
  return content.includes(text);
}

/**
 * Finds elements matching a tagText selector: querySelectorAll(tag) filtered
 * by text content.
 *
 * @param root - The document to search.
 * @param selector - The tagText selector.
 * @returns Matched elements, or null when the selector cannot be executed.
 */
function findByTagText(root: Document, selector: Selector): Element[] | null {
  if (!selector.value || !selector.text) {
    return null;
  }

  return Array.from(root.querySelectorAll(selector.value)).filter(
    (element) =>
      !element.closest(`[${INSPECTOR_ROOT_ATTRIBUTE}]`) &&
      elementContainsText(element, selector.text as string),
  );
}

/**
 * Finds elements matching a cssText selector: querySelectorAll(css) filtered
 * by text content.
 *
 * @param root - The document to search.
 * @param selector - The cssText selector.
 * @returns Matched elements, or null when the selector cannot be executed.
 */
function findByCssText(root: Document, selector: Selector): Element[] | null {
  const css = selector.value;
  if (!css || !selector.text) {
    return null;
  }

  try {
    return Array.from(root.querySelectorAll(css)).filter(
      (element) =>
        !element.closest(`[${INSPECTOR_ROOT_ATTRIBUTE}]`) &&
        elementContainsText(element, selector.text as string),
    );
  } catch {
    return null;
  }
}

/**
 * Finds elements matching a text-only selector by walking all elements and
 * filtering by text content.
 *
 * @param root - The document to search.
 * @param selector - The text selector.
 * @returns Matched elements, or null when the selector cannot be executed.
 */
function findByText(root: Document, selector: Selector): Element[] | null {
  if (!selector.text) {
    return null;
  }

  const {text} = selector;
  return Array.from(root.querySelectorAll('*')).filter(
    (element) =>
      !element.closest(`[${INSPECTOR_ROOT_ATTRIBUTE}]`) &&
      element.children.length === 0 &&
      elementContainsText(element, text),
  );
}

/**
 * Finds elements matching an XPath selector using document.evaluate.
 *
 * @param root - The document to search.
 * @param selector - The xpath selector.
 * @returns Matched elements, or null when the selector cannot be executed.
 */
function findByXpath(root: Document, selector: Selector): Element[] | null {
  if (!selector.value) {
    return null;
  }

  try {
    const result = root.evaluate(
      selector.value,
      root,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null,
    );

    const elements: Element[] = [];
    for (let i = 0; i < result.snapshotLength; i++) {
      const node = result.snapshotItem(i);
      if (
        node instanceof Element &&
        !node.closest(`[${INSPECTOR_ROOT_ATTRIBUTE}]`)
      ) {
        elements.push(node);
      }
    }
    return elements;
  } catch {
    return null;
  }
}

/**
 * Finds the elements a selector matches, dispatching to the appropriate
 * matching strategy based on selector kind.
 *
 * @param root - The document to search.
 * @param selector - The selector to run.
 * @returns The matched elements, or null when the selector cannot be executed.
 */
function findElements(root: Document, selector: Selector): Element[] | null {
  switch (selector.kind) {
    case 'tagText':
      return findByTagText(root, selector);
    case 'text':
      return findByText(root, selector);
    case 'xpath':
      return findByXpath(root, selector);
    case 'cssText':
      return findByCssText(root, selector);
    default: {
      const css = cssFor(selector);
      if (css === null) {
        return null;
      }
      return Array.from(root.querySelectorAll(css)).filter(
        (element) => !element.closest(`[${INSPECTOR_ROOT_ATTRIBUTE}]`),
      );
    }
  }
}

/**
 * Removes stamps left by an earlier pass so that elements which no longer
 * match do not keep stale ownership.
 *
 * @param root - The document to clean.
 */
function clearStamps(root: Document): void {
  for (const attribute of STAMP_ATTRIBUTES) {
    for (const element of Array.from(root.querySelectorAll(`[${attribute}]`))) {
      element.removeAttribute(attribute);
    }
  }
}

/**
 * Runs every selector in the index against the document and records, on each
 * matched element, which page object owns it.
 *
 * Ownership is recorded per element, so a child owned by one page object
 * inside a container owned by another is two separate stamps rather than a
 * conflict. Only two different classes claiming the *same* element counts.
 *
 * @param root - The document to stamp.
 * @param index - The generated page-object index.
 * @returns Counts describing what the pass did.
 */
export function stampOwnership(
  root: Document,
  index: PageObjectIndex,
): StampResult {
  clearStamps(root);

  const owners = new Map<Element, { classNames: Set<string>; first: string }>();
  let failed = 0;
  let unsupported = 0;

  const visit = (pageObject: PageObject, selector: Selector) => {
    let elements: Element[] | null;
    try {
      elements = findElements(root, selector);
    } catch {
      failed += 1;
      return;
    }

    if (elements === null) {
      unsupported += 1;
      return;
    }

    for (const element of elements) {
      const existing = owners.get(element);
      if (existing) {
        existing.classNames.add(pageObject.className);
      } else {
        owners.set(element, {
          classNames: new Set([pageObject.className]),
          first: selector.id,
        });
      }
    }

    if (elements.length > 5) {
      genericSelectorIds.add(selector.id);
    }
  };

  const genericSelectorIds = new Set<string>();

  for (const pageObject of index.pageObjects) {
    for (const selector of pageObject.selectors) {
      visit(pageObject, selector);
    }
  }

  let conflicts = 0;

  for (const [element, { classNames, first }] of owners) {
    const names = [...classNames];
    element.setAttribute(OWNER_ATTRIBUTE, names[0]);
    element.setAttribute(SELECTOR_ID_ATTRIBUTE, first);

    if (names.length > 1) {
      conflicts += 1;
      element.setAttribute(CONFLICT_ATTRIBUTE, names.join(','));
    }

    if (genericSelectorIds.has(first)) {
      element.setAttribute(VIEWPORT_ATTRIBUTE, '');
    }
  }

  return { stamped: owners.size, conflicts, failed, unsupported };
}
