import type { PageObject, Selector } from './extract';

/**
 * How two page objects came to declare the same selector, ordered by how much
 * judgement the fix needs.
 *
 * `shadowing` means a subclass redeclares a selector its ancestor already
 * declares, and the subclass copy should be deleted. `sibling` means two
 * classes share an ancestor that does not declare the selector, so it should
 * be hoisted to that ancestor. `cross-family` means the classes are
 * unrelated, and a human must pick a canonical owner or extract a shared page
 * object.
 */
export type OverlapClassification = 'shadowing' | 'sibling' | 'cross-family';

export type OverlapDeclaration = {
  className: string;
  relativePath: string;
  propertyName: string;
  line: number;
};

export type Overlap = {
  /** Canonical identity of the duplicated selector. */
  key: string;
  /** The duplicated selector rendered for a human reading a report. */
  display: string;
  classification: OverlapClassification;
  declarations: OverlapDeclaration[];
};

const SEVERITY: Record<OverlapClassification, number> = {
  shadowing: 0,
  sibling: 1,
  'cross-family': 2,
};

/**
 * Builds a stable identity for a selector so that two declarations can be
 * compared. Selectors that differ in kind are never the same selector, even
 * when their text matches.
 *
 * @param selector - The selector to identify.
 * @returns A canonical key.
 */
export function canonicalKey(selector: Selector): string {
  return [
    selector.kind,
    `value=${selector.value ?? ''}`,
    `chunks=${selector.chunks ? JSON.stringify(selector.chunks) : ''}`,
    `text=${selector.text ?? ''}`,
    `textExpression=${selector.textExpression ?? ''}`,
  ].join('|');
}

/**
 * Renders a selector the way it appears in source, so a report reads like the
 * code a developer will go and edit.
 *
 * @param selector - The selector to render.
 * @returns A human-readable label.
 */
export function displaySelector(selector: Selector): string {
  const base = selector.chunks
    ? selector.chunks.reduce(
        (rendered, chunk, index) =>
          index === 0
            ? chunk
            : `${rendered}\${${selector.params?.[index - 1] ?? '?'}}${chunk}`,
        '',
      )
    : (selector.value ?? '');

  const text =
    selector.text === undefined
      ? selector.textExpression
      : `"${selector.text}"`;

  if (text === undefined) {
    return base;
  }

  return base === '' ? `text ${text}` : `${base} + text ${text}`;
}

/**
 * Walks a class's ancestry.
 *
 * @param className - The class to start from.
 * @param parents - Map of class name to parent class name.
 * @returns The ancestors of the class, nearest first.
 */
function ancestorsOf(
  className: string,
  parents: Map<string, string | null>,
): string[] {
  const ancestors: string[] = [];
  const seen = new Set<string>([className]);

  let current = parents.get(className) ?? null;
  while (current && !seen.has(current)) {
    ancestors.push(current);
    seen.add(current);
    current = parents.get(current) ?? null;
  }

  return ancestors;
}

/**
 * Classifies the relationship between two classes that declare the same
 * selector.
 *
 * @param a - First class name.
 * @param b - Second class name.
 * @param parents - Map of class name to parent class name.
 * @returns How the duplication arose.
 */
function classifyPair(
  a: string,
  b: string,
  parents: Map<string, string | null>,
): OverlapClassification {
  const ancestorsA = ancestorsOf(a, parents);
  const ancestorsB = ancestorsOf(b, parents);

  if (ancestorsA.includes(b) || ancestorsB.includes(a)) {
    return 'shadowing';
  }

  const sharesAncestor = ancestorsA.some((ancestor) =>
    ancestorsB.includes(ancestor),
  );

  return sharesAncestor ? 'sibling' : 'cross-family';
}

/**
 * Finds selectors declared by more than one page-object class and classifies
 * each duplication by the kind of fix it needs.
 *
 * Duplication inside a single class is not an ownership overlap and is
 * ignored; only declarations spanning two or more classes are reported.
 *
 * @param pageObjects - Every page object extracted from the codebase.
 * @returns One entry per duplicated selector, most severe first.
 */
export function detectOverlaps(pageObjects: PageObject[]): Overlap[] {
  const parents = new Map<string, string | null>(
    pageObjects.map((pageObject) => [
      pageObject.className,
      pageObject.extendsClass,
    ]),
  );

  const byKey = new Map<
    string,
    { display: string; declarations: OverlapDeclaration[] }
  >();

  for (const pageObject of pageObjects) {
    for (const selector of pageObject.selectors) {
      const key = canonicalKey(selector);
      const group = byKey.get(key) ?? {
        display: displaySelector(selector),
        declarations: [],
      };
      group.declarations.push({
        className: pageObject.className,
        relativePath: pageObject.relativePath,
        propertyName: selector.propertyName,
        line: selector.line,
      });
      byKey.set(key, group);
    }
  }

  const overlaps: Overlap[] = [];

  for (const [key, { display, declarations }] of byKey) {
    const classNames = [...new Set(declarations.map((d) => d.className))];
    if (classNames.length < 2) {
      continue;
    }

    let classification: OverlapClassification = 'shadowing';
    for (let i = 0; i < classNames.length; i++) {
      for (let j = i + 1; j < classNames.length; j++) {
        const pair = classifyPair(classNames[i], classNames[j], parents);
        if (SEVERITY[pair] > SEVERITY[classification]) {
          classification = pair;
        }
      }
    }

    overlaps.push({ key, display, classification, declarations });
  }

  return overlaps.sort(
    (a, b) =>
      SEVERITY[b.classification] - SEVERITY[a.classification] ||
      b.declarations.length - a.declarations.length ||
      a.key.localeCompare(b.key),
  );
}
