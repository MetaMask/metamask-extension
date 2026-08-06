import {
  extractFromSource,
  type PageObject,
  type UnresolvedSelector,
} from './extract';
import { detectOverlaps, type Overlap } from './overlaps';

export type SourceFile = {
  relativePath: string;
  sourceText: string;
};

export type IndexSummary = {
  files: number;
  pageObjects: number;
  selectors: number;
  unresolved: number;
  overlaps: number;
};

export type PageObjectIndex = {
  pageObjects: PageObject[];
  overlaps: Overlap[];
  unresolved: UnresolvedSelector[];
  summary: IndexSummary;
};

type ExtractedSelector = PageObject['selectors'][number];

/**
 * Decides whether a selector is precise enough to be worth indexing.
 *
 * Only selectors anchored on a `data-testid` are kept. Everything else —
 * bare CSS classes, and anything matched by its visible text — resolves
 * ambiguously in a live wallet: class names are shared across unrelated
 * components, and text matching depends on locale and on which element in a
 * nest actually holds the string. Including them made the overlay claim
 * elements their page object does not really own.
 *
 * @param selector - The extracted selector.
 * @returns True when the selector is anchored on a test id.
 */
function isTestIdAnchored(selector: ExtractedSelector): boolean {
  // Text matching is imprecise regardless of how the element is located.
  if (selector.text !== undefined || selector.textExpression !== undefined) {
    return false;
  }

  if (selector.kind === 'testId') {
    return true;
  }

  // XPath is left out entirely: it cannot be evaluated with the same
  // querySelector path the overlay uses for everything else.
  if (selector.kind !== 'css') {
    return false;
  }

  const pattern = selector.chunks
    ? selector.chunks.join('')
    : selector.value ?? '';

  return pattern.includes('data-testid');
}

export type RuntimeSelector = {
  id: string;
  kind: PageObject['selectors'][number]['kind'];
  value?: string;
  text?: string;
  chunks?: string[];
  params?: string[];
  propertyName: string;
  line: number;
};

export type RuntimePageObjectIndex = {
  pageObjects: {
    className: string;
    relativePath: string;
    selectors: RuntimeSelector[];
  }[];
};

/**
 * Projects the full index down to the fields the browser overlay reads.
 *
 * The overlay ships inside a development build, so the artifact is trimmed of
 * everything only the CLI report needs: overlaps, unresolved selectors, the
 * inheritance graph and the raw expression text of computed values.
 *
 * @param index - The full index.
 * @returns The trimmed index.
 */
export function toRuntimeIndex(index: PageObjectIndex): RuntimePageObjectIndex {
  return {
    pageObjects: index.pageObjects.map(
      ({ className, relativePath, selectors }) => ({
        className,
        relativePath,
        selectors: selectors.map((selector) => {
          const runtime: RuntimeSelector = {
            id: selector.id,
            kind: selector.kind,
            propertyName: selector.propertyName,
            line: selector.line,
          };

          if (selector.value !== undefined) {
            runtime.value = selector.value;
          }
          if (selector.text !== undefined) {
            runtime.text = selector.text;
          }
          if (selector.chunks !== undefined) {
            runtime.chunks = selector.chunks;
            runtime.params = selector.params;
          }

          return runtime;
        }),
      }),
    ),
  };
}

/**
 * Builds the page-object index from already-read source files.
 *
 * File reading is left to the caller so this stays a pure function of its
 * input, which keeps it testable without touching the filesystem.
 *
 * @param options - The build options.
 * @param options.files - Every page-object source file to index.
 * @returns The index, including cross-file overlaps and a coverage summary.
 */
export function buildIndex({ files }: { files: SourceFile[] }): PageObjectIndex {
  const pageObjects: PageObject[] = [];
  const unresolved: UnresolvedSelector[] = [];

  for (const file of files) {
    const result = extractFromSource(file);
    pageObjects.push(
      ...result.pageObjects.map((pageObject) => ({
        ...pageObject,
        selectors: pageObject.selectors.filter(isTestIdAnchored),
      })),
    );
    unresolved.push(...result.unresolved);
  }

  const overlaps = detectOverlaps(pageObjects);

  return {
    pageObjects,
    overlaps,
    unresolved,
    summary: {
      files: files.length,
      pageObjects: pageObjects.length,
      selectors: pageObjects.reduce(
        (total, pageObject) => total + pageObject.selectors.length,
        0,
      ),
      unresolved: unresolved.length,
      overlaps: overlaps.length,
    },
  };
}
