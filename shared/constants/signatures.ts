/**
 * EIP-712 Permit PrimaryTypes
 */
export const PERMIT_PRIMARY_TYPE = {
  PERMIT: 'Permit',
  PERMIT_BATCH: 'PermitBatch',
  PERMIT_BATCH_TRANSFER_FROM: 'PermitBatchTransferFrom',
  PERMIT_SINGLE: 'PermitSingle',
  PERMIT_TRANSFER_FROM: 'PermitTransferFrom',
  ORDER: 'Order',
  ORDER_COMPONENTS: 'OrderComponents',
};

export const PERMIT_PRIMARY_TYPES: string[] =
  Object.values(PERMIT_PRIMARY_TYPE);
