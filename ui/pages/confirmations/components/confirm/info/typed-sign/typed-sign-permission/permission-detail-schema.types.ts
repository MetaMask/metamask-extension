import type { Hex } from '@metamask/utils';
import type { BigNumber } from 'bignumber.js';

export type I18nFunction = (
  key: string,
  args?: (string | number | undefined | null)[],
) => string;

/**
 * The context object passed to all accessor functions in the schema.
 * Built by the renderer from the decoded permission plus pre-resolved async data.
 */
export type PermissionContext = {
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
  /** i18n translation function. */
  t: I18nFunction;
  /** Pre-resolved native token info. Present when tokenResolution.kind === 'native'. */
  nativeToken?: {
    symbol: string;
    decimals: number;
    imageUrl?: string;
  };
  /** Pre-resolved ERC20 decimals. Present when tokenResolution.kind === 'erc20'. */
  erc20Decimals?: number;
};

// ---------------------------------------------------------------------------
// Field types — each maps to an existing rendering component
// ---------------------------------------------------------------------------

/** Renders a native token amount using NativeAmountRow. */
export type NativeAmountField = {
  type: 'nativeAmount';
  labelKey: string;
  getValue: (ctx: PermissionContext) => Hex | BigNumber;
  tooltip?: string;
  visible?: (ctx: PermissionContext) => boolean;
};

/** Renders an ERC20 token amount using TokenAmountRow. */
export type TokenAmountField = {
  type: 'tokenAmount';
  labelKey: string;
  getValue: (ctx: PermissionContext) => Hex | BigNumber;
  getTokenAddress: (ctx: PermissionContext) => string;
  tooltip?: string;
  visible?: (ctx: PermissionContext) => boolean;
};

/** Renders a plain text row using ConfirmInfoRow + Text. */
export type TextField = {
  type: 'text';
  labelKey: string;
  getValue: (ctx: PermissionContext) => string;
  tooltip?: string;
  visible?: (ctx: PermissionContext) => boolean;
};

/** Renders a date row using DateAndTimeRow. */
export type DateField = {
  type: 'date';
  labelKey: string;
  getTimestamp: (ctx: PermissionContext) => number;
  tooltip?: string;
  visible?: (ctx: PermissionContext) => boolean;
};

/** Renders the Expiry component. */
export type ExpiryField = {
  type: 'expiry';
  visible?: (ctx: PermissionContext) => boolean;
};

/** Stream parameters needed by the TotalExposure component. */
export type TotalExposureStreamParams = {
  initialAmount?: Hex | null;
  maxAmount?: Hex | null;
  amountPerSecond: Hex;
  startTime: number;
};

/** Renders the TotalExposure component. */
export type TotalExposureField = {
  type: 'totalExposure';
  variant: 'native' | 'erc20';
  getStreamParams: (ctx: PermissionContext) => TotalExposureStreamParams;
  visible?: (ctx: PermissionContext) => boolean;
};

/** A visual divider between rows. */
export type DividerElement = {
  type: 'divider';
};

/** Union of all renderable items within a section. */
export type SchemaElement =
  | NativeAmountField
  | TokenAmountField
  | TextField
  | DateField
  | ExpiryField
  | TotalExposureField
  | DividerElement;

/** A section groups elements visually (renders inside ConfirmInfoSection). */
export type SchemaSection = {
  testId: string;
  elements: SchemaElement[];
};

// ---------------------------------------------------------------------------
// Token resolution — tells the renderer what async data to pre-resolve
// ---------------------------------------------------------------------------

export type TokenResolution =
  | { kind: 'native' }
  | {
      kind: 'erc20';
      getTokenAddress: (permission: { data: Record<string, unknown> }) => string;
    }
  | { kind: 'none' };

// ---------------------------------------------------------------------------
// Schema entry and registry
// ---------------------------------------------------------------------------

/** A complete schema entry for one permission type. */
export type PermissionSchemaEntry = {
  /** Declares what token data the renderer should resolve before rendering. */
  tokenResolution: TokenResolution;
  /** Optional validation run before rendering. Throw to trigger error boundary. */
  validate?: (permission: { data: Record<string, unknown> }) => void;
  /** Sections to render (each maps to a ConfirmInfoSection). */
  sections: SchemaSection[];
};

/** Maps permission type strings to their schema entries. */
export type PermissionSchemaRegistry = Record<string, PermissionSchemaEntry>;
