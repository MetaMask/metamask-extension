import type {
  BridgeControllerState,
  GenericQuoteRequest,
} from '../../types/bridge';

export const isValidQuoteRequest = (
  partialRequest: Partial<BridgeControllerState['bridgeState']['quoteRequest']>,
  requireAmount = true,
): partialRequest is GenericQuoteRequest => {
  const STRING_FIELDS = [
    'srcTokenAddress',
    'destTokenAddress',
    'srcChainId',
    'destChainId',
    'walletAddress',
  ];
  if (requireAmount) {
    STRING_FIELDS.push('srcTokenAmount');
  }
  const NUMBER_FIELDS = [];

  // if slippage is defined, require it to be a number
  if (partialRequest.slippage !== undefined) {
    NUMBER_FIELDS.push('slippage');
  }

  return (
    STRING_FIELDS.every(
      (field) =>
        field in partialRequest &&
        typeof partialRequest[field as keyof typeof partialRequest] ===
          'string' &&
        partialRequest[field as keyof typeof partialRequest] !== undefined &&
        partialRequest[field as keyof typeof partialRequest] !== '' &&
        partialRequest[field as keyof typeof partialRequest] !== null,
    ) &&
    NUMBER_FIELDS.every(
      (field) =>
        field in partialRequest &&
        typeof partialRequest[field as keyof typeof partialRequest] ===
          'number' &&
        partialRequest[field as keyof typeof partialRequest] !== undefined &&
        !isNaN(Number(partialRequest[field as keyof typeof partialRequest])) &&
        partialRequest[field as keyof typeof partialRequest] !== null,
    ) &&
    (requireAmount
      ? Boolean((partialRequest.srcTokenAmount ?? '').match(/^[1-9]\d*$/u))
      : true)
  );
};
