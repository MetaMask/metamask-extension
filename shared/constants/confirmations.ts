/**
 * POC flag. When true, non-EVM send confirmations triggered via
 * `snap_confirmTransaction` render the new universal multichain
 * confirmation page instead of the legacy snap-templated dialog.
 */
export const USE_UNIVERSAL_MULTICHAIN_CONFIRMATION = true;

/**
 * Approval type used by `snap_confirmTransaction` flows. Cast to
 * {@link ApprovalType} at call sites until the canonical enum in
 * `@metamask/controller-utils` is updated.
 */
export const UNIVERSAL_TRANSACTION_APPROVAL_TYPE = 'universalTransaction';
