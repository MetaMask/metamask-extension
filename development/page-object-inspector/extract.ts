import ts from 'typescript';

/**
 * Mirrors the `RawLocator` union in `test/e2e/page-objects/common.ts`, plus
 * `xpath`, which several page objects use even though it is absent from that
 * union.
 */
export type SelectorKind =
  | 'css'
  | 'testId'
  | 'cssText'
  | 'tagText'
  | 'text'
  | 'xpath';

export type Selector = {
  id: string;
  kind: SelectorKind;
  /** The CSS selector, tag name, testid, or XPath expression. Static only. */
  value?: string;
  /** Visible text the element must contain, for the text-bearing kinds. */
  text?: string;
  /**
   * Source of the expression producing the visible text, when it is computed
   * rather than literal — most often a `tEn('key')` i18n lookup. Retained so
   * that selectors differing only by their computed text stay distinct.
   */
  textExpression?: string;
  /**
   * Literal fragments of a dynamic selector, surrounding each interpolated
   * hole. Always one longer than `params`.
   */
  chunks?: string[];
  /** Names of the interpolated holes, in source order. */
  params?: string[];
  propertyName: string;
  line: number;
  isDynamic: boolean;
};

export type UnresolvedReason =
  | 'unanchored-pattern'
  | 'uninterpretable-expression';

export type UnresolvedSelector = {
  relativePath: string;
  className: string;
  propertyName: string;
  line: number;
  reason: UnresolvedReason;
};

export type PageObject = {
  className: string;
  relativePath: string;
  extendsClass: string | null;
  selectors: Selector[];
};

export type ExtractResult = {
  pageObjects: PageObject[];
  unresolved: UnresolvedSelector[];
};

export type ExtractOptions = {
  relativePath: string;
  sourceText: string;
};

type SelectorParts = Pick<
  Selector,
  | 'kind'
  | 'value'
  | 'text'
  | 'textExpression'
  | 'chunks'
  | 'params'
  | 'isDynamic'
>;

/** A locator object property, in decreasing order of how much we understand it. */
type LocatorValue =
  | { literal: string }
  | { chunks: string[]; params: string[] }
  | { expression: string };

type Classification =
  | { ok: true; parts: SelectorParts }
  | { ok: false; reason: UnresolvedReason }
  | null;

/**
 * Reads the name of the class a declaration extends.
 *
 * @param node - The class declaration to inspect.
 * @returns The parent class name, or null when the class extends nothing.
 */
function readExtendsClass(node: ts.ClassDeclaration): string | null {
  const heritage = node.heritageClauses?.find(
    (clause) => clause.token === ts.SyntaxKind.ExtendsKeyword,
  );
  const parent = heritage?.types[0]?.expression;

  return parent && ts.isIdentifier(parent) ? parent.text : null;
}

function lineOf(sourceFile: ts.SourceFile, node: ts.Node): number {
  return (
    sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1
  );
}

/**
 * Reads an object literal into a map of its properties, recording each value
 * as either a literal string or the source of the expression producing it.
 *
 * Computed values must be recorded rather than dropped: a locator such as
 * `{ css: 'p', text: tEn('interactingWith') }` is meaningless without its
 * text, and discarding it would silently collapse many distinct selectors into
 * one bogus shared selector.
 *
 * @param node - The object literal to read.
 * @param siblingLiterals
 * @returns The locator values, keyed by property name.
 */
function readLocatorProperties(
  node: ts.ObjectLiteralExpression,
  siblingLiterals: Map<string, string>,
): Record<string, LocatorValue> {
  const properties: Record<string, LocatorValue> = {};

  for (const property of node.properties) {
    if (!ts.isPropertyAssignment(property) || !ts.isIdentifier(property.name)) {
      continue;
    }
    properties[property.name.text] = readLocatorValue(
      property.initializer,
      siblingLiterals,
    );
  }

  return properties;
}

/**
 * Interprets a single locator value expression.
 *
 * Composite locators frequently reference another selector on the same class,
 * as in `{ css: this.address, text: 'Etherscan' }`, so `this.` references are
 * resolved against the class's own literal selectors.
 *
 * @param node - The expression to interpret.
 * @param siblingLiterals - Literal selectors declared on the same class.
 * @returns The most specific interpretation available.
 */
function readLocatorValue(
  node: ts.Expression,
  siblingLiterals: Map<string, string>,
): LocatorValue {
  const expression = unwrapAssertions(node);

  if (ts.isStringLiteralLike(expression)) {
    return { literal: expression.text };
  }
  if (ts.isTemplateExpression(expression)) {
    return splitTemplate(expression);
  }
  if (
    ts.isPropertyAccessExpression(expression) &&
    expression.expression.kind === ts.SyntaxKind.ThisKeyword
  ) {
    const referenced = siblingLiterals.get(expression.name.text);
    if (referenced !== undefined) {
      return { literal: referenced };
    }
  }
  return { expression: expression.getText() };
}

/**
 * Collects the literal string selectors a class declares, so that composite
 * locators referencing them via `this.` can be resolved regardless of the
 * order the properties appear in.
 *
 * @param node - The class declaration to scan.
 * @returns Literal selector values, keyed by property name.
 */
function collectLiteralSelectors(
  node: ts.ClassDeclaration,
): Map<string, string> {
  const literals = new Map<string, string>();

  for (const member of node.members) {
    if (
      ts.isPropertyDeclaration(member) &&
      member.initializer &&
      ts.isIdentifier(member.name)
    ) {
      const initializer = unwrapAssertions(member.initializer);
      if (ts.isStringLiteralLike(initializer)) {
        literals.set(member.name.text, initializer.text);
      }
    }
  }

  return literals;
}

/**
 * Strips `as const` and other type assertions, which wrap otherwise ordinary
 * literal values in several page objects.
 *
 * @param node - The expression to unwrap.
 * @returns The underlying expression.
 */
function unwrapAssertions(node: ts.Expression): ts.Expression {
  let current = node;
  while (ts.isAsExpression(current) || ts.isTypeAssertionExpression(current)) {
    current = current.expression;
  }
  return current;
}

/**
 * Builds the selector parts for a locator value that carries the element's
 * primary identity — its testid, CSS selector, tag, or XPath.
 *
 * @param kind - The selector kind this value produces.
 * @param value - The locator value.
 * @returns The selector parts, or null when the value is not interpretable.
 */
function identityParts(
  kind: SelectorKind,
  value: LocatorValue,
): SelectorParts | null {
  if ('literal' in value) {
    return { kind, value: value.literal, isDynamic: false };
  }
  if ('chunks' in value) {
    return isAnchored(value.chunks)
      ? { kind, chunks: value.chunks, params: value.params, isDynamic: true }
      : null;
  }
  return null;
}

/**
 * Builds the text-related selector parts from a locator's `text` property.
 *
 * @param text - The locator's text value.
 * @returns The text parts to merge into the selector.
 */
function textParts(
  text: LocatorValue,
): Pick<Selector, 'text' | 'textExpression' | 'isDynamic'> {
  if ('literal' in text) {
    return { text: text.literal, isDynamic: false };
  }
  if ('chunks' in text) {
    return { textExpression: text.chunks.join('…'), isDynamic: true };
  }
  return { textExpression: text.expression, isDynamic: true };
}

/**
 * Classifies a locator object literal into a selector kind and its parts.
 *
 * @param properties - The properties of the object literal.
 * @returns The classified selector parts, or null if this is not a locator.
 */
function classifyLocatorObject(
  properties: Record<string, LocatorValue>,
): SelectorParts | null {
  const { testId, xpath, css, tag, text } = properties;

  if (testId !== undefined) {
    return identityParts('testId', testId);
  }
  if (xpath !== undefined) {
    return identityParts('xpath', xpath);
  }
  if (tag !== undefined && text !== undefined) {
    const parts = identityParts('tagText', tag);
    return parts && { ...parts, ...mergeDynamic(parts, textParts(text)) };
  }
  if (css !== undefined && text !== undefined) {
    const parts = identityParts('cssText', css);
    return parts && { ...parts, ...mergeDynamic(parts, textParts(text)) };
  }
  if (css !== undefined) {
    return identityParts('css', css);
  }
  if (text !== undefined) {
    return { kind: 'text', ...textParts(text) };
  }

  return null;
}

/**
 * Distinguishes a locator rejected for being too broad from one we simply
 * could not read, so the report tells the truth about why it was dropped.
 *
 * @param properties - The properties of the locator object.
 * @returns True when an identity value was a pattern with nothing to anchor it.
 */
function hasUnanchoredIdentity(
  properties: Record<string, LocatorValue>,
): boolean {
  return [
    properties.testId,
    properties.xpath,
    properties.css,
    properties.tag,
  ].some((value) => value && 'chunks' in value && !isAnchored(value.chunks));
}

/**
 * Combines the dynamic flags of a selector's identity and text parts, so a
 * selector counts as dynamic when either half is.
 *
 * @param identity - The identity parts.
 * @param text - The text parts.
 * @returns The text parts with a combined `isDynamic`.
 */
function mergeDynamic(
  identity: SelectorParts,
  text: Pick<Selector, 'text' | 'textExpression' | 'isDynamic'>,
): Pick<Selector, 'text' | 'textExpression' | 'isDynamic'> {
  return { ...text, isDynamic: Boolean(identity.isDynamic || text.isDynamic) };
}

/** Attribute selectors left with an empty value once the holes are removed. */
const EMPTY_ATTRIBUTE_SELECTOR = /\[[\w-]+=(?:""|'')\]/gu;

/** Characters that constrain nothing on their own. */
const NON_IDENTIFYING = /[\s>+~,*]/gu;

/**
 * Decides whether a dynamic selector retains enough literal text, once its
 * holes are removed, to identify a bounded set of elements.
 *
 * A selector that is nothing but structure around a hole — as in
 * `[data-testid="${name}"]` — would match every element carrying that
 * attribute and claim ownership of most of the DOM, so it is rejected. A hole
 * filling one attribute is fine when something else narrows the selector, as
 * in `[data-testid="to-amount"][value="${amount}"]`.
 *
 * @param chunks - The literal fragments surrounding each hole.
 * @returns True when literal text still constrains the match.
 */
function isAnchored(chunks: string[]): boolean {
  const residue = chunks
    .join('')
    .replace(EMPTY_ATTRIBUTE_SELECTOR, '')
    .replace(NON_IDENTIFYING, '');

  return residue !== '';
}

/**
 * Splits a template expression into its literal fragments and hole names.
 *
 * @param node - The template expression to split.
 * @returns The literal chunks and the source text of each hole.
 */
function splitTemplate(node: ts.TemplateExpression): {
  chunks: string[];
  params: string[];
} {
  const chunks = [node.head.text];
  const params: string[] = [];

  for (const span of node.templateSpans) {
    params.push(span.expression.getText());
    chunks.push(span.literal.text);
  }

  return { chunks, params };
}

/**
 * Classifies the initializer of a class property into selector parts.
 *
 * @param initializer - The property initializer expression.
 * @param siblingLiterals - Literal selectors declared on the same class.
 * @returns A classification, or null when the property is not a selector.
 */
function classifyInitializer(
  initializer: ts.Expression,
  siblingLiterals: Map<string, string>,
): Classification {
  if (ts.isStringLiteralLike(initializer)) {
    return {
      ok: true,
      parts: { kind: 'css', value: initializer.text, isDynamic: false },
    };
  }

  if (ts.isObjectLiteralExpression(initializer)) {
    const parts = classifyLocatorObject(
      readLocatorProperties(initializer, siblingLiterals),
    );
    return parts ? { ok: true, parts } : null;
  }

  if (ts.isArrowFunction(initializer)) {
    return classifyArrowFunction(initializer, siblingLiterals);
  }

  return null;
}

/**
 * Classifies an arrow-function property.
 *
 * Page objects declare both parameterised selectors and action methods as
 * arrow-function properties. A block body or an `async` modifier marks a
 * method, which is not a selector and must not be counted as an unresolved
 * one.
 *
 * @param node - The arrow function to classify.
 * @param siblingLiterals - Literal selectors declared on the same class.
 * @returns A classification, or null when the property is a method.
 */
function classifyArrowFunction(
  node: ts.ArrowFunction,
  siblingLiterals: Map<string, string>,
): Classification {
  const isAsync = node.modifiers?.some(
    (modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword,
  );

  if (isAsync || ts.isBlock(node.body)) {
    return null;
  }

  let {body} = node;
  while (ts.isParenthesizedExpression(body)) {
    body = body.expression;
  }

  if (ts.isStringLiteralLike(body)) {
    return {
      ok: true,
      parts: { kind: 'css', value: body.text, isDynamic: false },
    };
  }

  if (ts.isTemplateExpression(body)) {
    const { chunks, params } = splitTemplate(body);
    return isAnchored(chunks)
      ? { ok: true, parts: { kind: 'css', chunks, params, isDynamic: true } }
      : { ok: false, reason: 'unanchored-pattern' };
  }

  if (ts.isObjectLiteralExpression(body)) {
    const properties = readLocatorProperties(body, siblingLiterals);
    const parts = classifyLocatorObject(properties);
    if (parts) {
      return { ok: true, parts };
    }
    return {
      ok: false,
      reason: hasUnanchoredIdentity(properties)
        ? 'unanchored-pattern'
        : 'uninterpretable-expression',
    };
  }

  return { ok: false, reason: 'uninterpretable-expression' };
}

/**
 * Parses a single page-object source file and extracts every class it declares
 * along with the selectors declared directly on that class.
 *
 * @param options - The extraction options.
 * @param options.relativePath - Path of the file relative to the page-objects
 * root, used for reporting and as part of selector provenance.
 * @param options.sourceText - The TypeScript source to parse.
 * @returns The page objects found in the file and any selectors that could not
 * be interpreted.
 */
export function extractFromSource({
  relativePath,
  sourceText,
}: ExtractOptions): ExtractResult {
  const sourceFile = ts.createSourceFile(
    relativePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
  );

  const pageObjects: PageObject[] = [];
  const unresolved: UnresolvedSelector[] = [];

  sourceFile.forEachChild((node) => {
    if (!ts.isClassDeclaration(node) || !node.name) {
      return;
    }

    const className = node.name.text;
    const siblingLiterals = collectLiteralSelectors(node);
    const selectors: Selector[] = [];

    for (const member of node.members) {
      if (
        !ts.isPropertyDeclaration(member) ||
        !member.initializer ||
        !ts.isIdentifier(member.name)
      ) {
        continue;
      }

      const classification = classifyInitializer(
        member.initializer,
        siblingLiterals,
      );
      if (!classification) {
        continue;
      }

      const propertyName = member.name.text;
      const line = lineOf(sourceFile, member);

      if (!classification.ok) {
        unresolved.push({
          relativePath,
          className,
          propertyName,
          line,
          reason: classification.reason,
        });
        continue;
      }

      selectors.push({
        id: `${className}.${propertyName}`,
        ...classification.parts,
        propertyName,
        line,
      });
    }

    pageObjects.push({
      className,
      relativePath,
      extendsClass: readExtendsClass(node),
      selectors,
    });
  });

  return { pageObjects, unresolved };
}
