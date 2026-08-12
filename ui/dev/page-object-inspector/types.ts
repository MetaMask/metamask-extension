/**
 * Runtime view of the artifact produced by
 * `development/page-object-inspector`. The JSON file is the contract between
 * the two, so these types are declared independently rather than imported
 * across the `ui/` and `development/` boundary. Keep them in step with
 * `development/page-object-inspector/extract.ts`.
 */

/**
 * All selector kinds the extractor understands. The runtime index now carries
 * every kind so the inspector can flag non-testId locators as needing
 * migration.
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
  value?: string;
  text?: string;
  chunks?: string[];
  params?: string[];
  propertyName: string;
  line: number;
  isDynamic: boolean;
};

export type PinnedElement = {
  ownerClassName: string;
  relativePath: string;
  selector: Selector;
  conflictingClassNames: string[];
  /** True when the element has a data-testid but no PO covers it. */
  isUncovered: boolean;
  /** The raw data-testid value when the element is uncovered. */
  uncoveredTestId?: string;
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
