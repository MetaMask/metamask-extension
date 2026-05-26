import type { Hex } from '@metamask/utils';
import type { BigNumber } from 'bignumber.js';

/** Recursively strips `null` and `undefined` from all properties. */
export type DeepNonNullable<TObj> = TObj extends object
  ? { [K in keyof TObj]-?: DeepNonNullable<NonNullable<TObj[K]>> }
  : NonNullable<TObj>;

export type I18nFunction = (
  key: string,
  args?: (string | number | undefined | null)[],
) => string;

/** A translatable value: an i18n key with optional interpolation args. */
export type I18nValue = {
  key: string;
  args?: (string | number)[];
};

/** Views in which a schema element can appear. */
export type FieldView = 'confirmation' | 'reviewDetail' | 'reviewSummary';

/** Gator review surfaces only (`reviewDetail` / `reviewSummary`). Confirmation uses `FieldView`'s `confirmation` in the signing flow renderer. */
export type ReviewFieldView = Exclude<FieldView, 'confirmation'>;

/**
 * The context object passed to all accessor functions in the schema.
 * Built by each renderer from decoded permission data plus pre-resolved async data.
 */
export type PermissionRenderContext = {
  /** The permission object from the decoded permission. */
  permission: {
    type: string;
    data: Record<string, unknown>;
    justification?: string;
  };
  /** Expiry timestamp in Unix seconds, or null if no expiry. */
  expiry: number | null;
  /** Chain ID in hex format. */
  chainId: Hex;
  /** The origin URL of the request. Only required for confirmation views. */
  origin?: string;
  /** The recipient / delegate address, if present. */
  to?: string;
  /** Pre-resolved token info. Present when tokenResolution.kind is 'native' or 'erc20'. */
  tokenInfo?: {
    symbol: string;
    decimals: number | undefined;
    imageUrl?: string;
  };
  /**
   * Total exposure for `native-token-stream` / `erc20-token-stream`, computed once when
   * the context is built. Omitted for other permission types.
   */
  streamTotalExposure?: BigNumber | null;
};

// ---------------------------------------------------------------------------
// Token variant — distinguishes native vs ERC20 for amount rendering
// ---------------------------------------------------------------------------

/** Whether an amount field is for a native token or an ERC20 token. */
export type TokenVariant = 'native' | 'erc20';

// ---------------------------------------------------------------------------
// Field types — view-agnostic, describe WHAT to show, not HOW
// ---------------------------------------------------------------------------

/** An amount field (native or ERC20). Renderers decide formatting. */
export type AmountField = {
  type: 'amount';
  labelKey: string;
  testId: string;
  /** BigNumber value. Each renderer formats this for its view. */
  getValue: (ctx: PermissionRenderContext) => BigNumber;
  /** For ERC20 amounts, returns the token contract address. */
  getTokenAddress?: (ctx: PermissionRenderContext) => Hex;
  tooltip?: string;
  isVisible: (ctx: PermissionRenderContext) => boolean;
  includeInViews: FieldView[];
  /** If true, the review renderer appends "/sec" to the formatted value. */
  isRatePerSecond?: boolean;
};

/** A plain text row. */
export type TextField = {
  type: 'text';
  labelKey: string;
  testId: string;
  getValue: (ctx: PermissionRenderContext) => I18nValue;
  tooltip?: string;
  isVisible: (ctx: PermissionRenderContext) => boolean;
  includeInViews: FieldView[];
};

/** A date/time row. */
export type DateField = {
  type: 'date';
  labelKey: string;
  testId: string;
  getValue: (ctx: PermissionRenderContext) => number;
  tooltip?: string;
  isVisible: (ctx: PermissionRenderContext) => boolean;
  includeInViews: FieldView[];
};

/** An expiry row. Renderers handle the "never expires" case. */
export type ExpiryField = {
  type: 'expiry';
  labelKey: string;
  testId: string;
  getValue: (ctx: PermissionRenderContext) => number | null;
  isVisible: (ctx: PermissionRenderContext) => boolean;
  includeInViews: FieldView[];
};

/** A visual divider between rows. */
export type DividerElement = {
  type: 'divider';
  includeInViews: FieldView[];
};

// ---------------------------------------------------------------------------
// Common fields — describe top-level decoded permission properties
// ---------------------------------------------------------------------------

/** Displays the justification text. */
export type JustificationField = {
  type: 'justification';
  labelKey: string;
  testId: string;
  getValue: (ctx: PermissionRenderContext) => string | I18nValue;
  isVisible: (ctx: PermissionRenderContext) => boolean;
  includeInViews: FieldView[];
};

/** Displays the account row (account selector). */
export type AccountField = {
  type: 'account';
  labelKey: string;
  testId: string;
  getValue: (ctx: PermissionRenderContext) => undefined;
  isVisible: (ctx: PermissionRenderContext) => boolean;
  includeInViews: FieldView[];
};

/** Displays the request origin URL. */
export type OriginField = {
  type: 'origin';
  labelKey: string;
  testId: string;
  getValue: (ctx: PermissionRenderContext) => string | undefined;
  tooltip?: string;
  isVisible: (ctx: PermissionRenderContext) => boolean;
  includeInViews: FieldView[];
};

/** Displays a recipient / delegate address. */
export type AddressField = {
  type: 'address';
  labelKey: string;
  testId: string;
  getValue: (ctx: PermissionRenderContext) => string | undefined;
  isVisible: (ctx: PermissionRenderContext) => boolean;
  includeInViews: FieldView[];
};

/** Displays the network row. */
export type NetworkField = {
  type: 'network';
  includeInViews: FieldView[];
};

/** Union of all renderable items within a section. */
export type SchemaElement =
  | AmountField
  | TextField
  | DateField
  | ExpiryField
  | DividerElement
  | JustificationField
  | AccountField
  | OriginField
  | AddressField
  | NetworkField;

/** A section groups elements visually. */
export type SchemaSection = {
  /** Test ID for the section container. Each renderer maps this to its own wrapper. */
  testId: string;
  elements: SchemaElement[];
};

// ---------------------------------------------------------------------------
// Token resolution — tells renderers what async data to pre-resolve
// ---------------------------------------------------------------------------

export type TokenResolution =
  | { kind: 'native' }
  | {
      kind: 'erc20';
      getTokenAddress: (permission: {
        data: Record<string, unknown>;
      }) => string;
    }
  | { kind: 'none' };

// ---------------------------------------------------------------------------
// Schema entry and registry
// ---------------------------------------------------------------------------

/** A complete schema entry for one permission type. */
export type PermissionSchemaEntry = {
  /** Whether this permission deals with a native token, ERC20 token, or neither. */
  tokenVariant: TokenVariant | 'none';
  /** Declares what token data the renderer should resolve before rendering. */
  tokenResolution: TokenResolution;
  /** Optional validation run before rendering. Throw to trigger error boundary. */
  validate?: (permission: { data: Record<string, unknown> }) => void;
  /** Sections to render. */
  sections: SchemaSection[];
};

/** Maps permission type strings to their schema entries. */
export type PermissionSchemaRegistry = Record<string, PermissionSchemaEntry>;
