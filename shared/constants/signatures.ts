export enum PrimaryTypeOrder {
  Order = 'Order',
  OrderComponents = 'OrderComponents',
}

export enum PrimaryTypePermit {
  Permit = 'Permit',
  PermitBatch = 'PermitBatch',
  PermitBatchTransferFrom = 'PermitBatchTransferFrom',
  PermitSingle = 'PermitSingle',
  PermitTransferFrom = 'PermitTransferFrom',
  PermitWitnessTransferFrom = 'PermitWitnessTransferFrom',
}

/**
 * EIP-3009 PrimaryTypes. These move tokens directly rather than approving a
 * spender, so they are kept apart from the permit types.
 */
export enum PrimaryTypeTransferAuthorization {
  ReceiveWithAuthorization = 'ReceiveWithAuthorization',
  TransferWithAuthorization = 'TransferWithAuthorization',
}

/**
 * EIP-712 Permit PrimaryTypes
 */
export const PrimaryType = {
  ...PrimaryTypeOrder,
  ...PrimaryTypePermit,
  ...PrimaryTypeTransferAuthorization,
} as const;

// Create a type from the const object
export type PrimaryType = (typeof PrimaryType)[keyof typeof PrimaryType];

export const PRIMARY_TYPES_ORDER: PrimaryTypeOrder[] =
  Object.values(PrimaryTypeOrder);
export const PRIMARY_TYPES_PERMIT: PrimaryTypePermit[] =
  Object.values(PrimaryTypePermit);
export const PRIMARY_TYPES_TRANSFER_AUTHORIZATION: PrimaryTypeTransferAuthorization[] =
  Object.values(PrimaryTypeTransferAuthorization);
