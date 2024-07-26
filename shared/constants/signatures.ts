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
}

/**
 * EIP-712 Permit PrimaryTypes
 */
export enum PrimaryType {
  Order = 'Order',
  OrderComponents = 'OrderComponents',
  Permit = 'Permit',
  PermitBatch = 'PermitBatch',
  PermitBatchTransferFrom = 'PermitBatchTransferFrom',
  PermitSingle = 'PermitSingle',
  PermitTransferFrom = 'PermitTransferFrom',
}

export const PRIMARY_TYPES_ORDER: string[] = Object.values(PrimaryTypeOrder);
export const PRIMARY_TYPES_PERMIT: string[] = Object.values(PrimaryTypePermit);
export const PRIMARY_TYPES: string[] = Object.values(PrimaryType);
