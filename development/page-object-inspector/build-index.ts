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

export type RuntimeSelector = {
  id: string;
  kind: PageObject['selectors'][number]['kind'];
  value?: string;
  text?: string;
  textExpression?: string;
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
          if (selector.textExpression !== undefined) {
            runtime.textExpression = selector.textExpression;
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
export function buildIndex({
  files,
}: {
  files: SourceFile[];
}): PageObjectIndex {
  const pageObjects: PageObject[] = [];
  const unresolved: UnresolvedSelector[] = [];

  for (const file of files) {
    const result = extractFromSource(file);
    pageObjects.push(...result.pageObjects);
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
