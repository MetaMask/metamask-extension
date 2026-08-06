/**
 * Runtime view of the artifact produced by
 * `development/page-object-inspector`. The JSON file is the contract between
 * the two, so these types are declared independently rather than imported
 * across the `ui/` and `development/` boundary. Keep them in step with
 * `development/page-object-inspector/extract.ts`.
 */

/**
 * The index only carries selectors anchored on a `data-testid`, so the
 * text-based and XPath kinds the extractor understands never reach the
 * browser.
 */
export type SelectorKind = 'css' | 'testId';

export type Selector = {
  id: string;
  kind: SelectorKind;
  value?: string;
  chunks?: string[];
  params?: string[];
  propertyName: string;
  line: number;
  isDynamic: boolean;
};

export type PageObject = {
  className: string;
  relativePath: string;
  extendsClass: string | null;
  selectors: Selector[];
};

export type PageObjectIndex = {
  pageObjects: PageObject[];
};

/**
 * Marks the inspector's own UI so the matcher never claims it as part of the
 * wallet.
 */
export const INSPECTOR_ROOT_ATTRIBUTE = 'data-po-inspector';

/** Attributes the matcher writes onto the DOM. */
export const OWNER_ATTRIBUTE = 'data-po-owner';
export const SELECTOR_ID_ATTRIBUTE = 'data-po-selector-id';
export const CONFLICT_ATTRIBUTE = 'data-po-conflict';

export const STAMP_ATTRIBUTES = [
  OWNER_ATTRIBUTE,
  SELECTOR_ID_ATTRIBUTE,
  CONFLICT_ATTRIBUTE,
];
