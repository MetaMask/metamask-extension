/**
 * EIP-712 Permit PrimaryTypes
 */
export const PRIMARY_TYPE = Object.freeze({
  PERMIT: 'Permit',
  PERMIT_BATCH: 'PermitBatch',
  PERMIT_BATCH_TRANSFER_FROM: 'PermitBatchTransferFrom',
  PERMIT_SINGLE: 'PermitSingle',
  PERMIT_TRANSFER_FROM: 'PermitTransferFrom',
  ORDER: 'Order',
  ORDER_COMPONENTS: 'OrderComponents',
});

export const PRIMARY_TYPES: string[] = Object.values(PRIMARY_TYPE);
