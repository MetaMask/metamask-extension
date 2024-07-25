/**
 * EIP-712 Permit PrimaryTypes
 */
export const PRIMARY_TYPE = {
  PERMIT: 'Permit',
  PERMIT_BATCH: 'PermitBatch',
  PERMIT_BATCH_TRANSFER_FROM: 'PermitBatchTransferFrom',
  PERMIT_SINGLE: 'PermitSingle',
  PERMIT_TRANSFER_FROM: 'PermitTransferFrom',
  ORDER: 'Order',
  ORDER_COMPONENTS: 'OrderComponents',
} as const;

export type PrimaryType = (typeof PRIMARY_TYPE)[keyof typeof PRIMARY_TYPE];

export const PRIMARY_TYPES: string[] = Object.values(PRIMARY_TYPE);
