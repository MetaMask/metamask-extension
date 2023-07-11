export function isCaipChainId(caipChainId: string): boolean {
  return caipChainId.startsWith('eip155:');
}
export function getCaipChainIdFromEthChainId(ethChainId: string): string {
  const chainIdDecimal = ethChainId.startsWith('0x')
    ? parseInt(ethChainId, 16).toString(10)
    : ethChainId;
  return `eip155:${chainIdDecimal}`;
}

export function getEthChainIdDecFromCaipChainId(caipChainId: string): string {
  return caipChainId.replace(/^eip155:/, '')
}

export function getEthChainIdHexFromCaipChainId(caipChainId: string): string {
  const chainIdDecimal = getEthChainIdDecFromCaipChainId(caipChainId)
  return `0x${parseInt(chainIdDecimal, 10).toString(16)}`;
}

export function getEthChainIdNumFromCaipChainId(caipChainId: string): number {
  const chainIdDecimal = getEthChainIdDecFromCaipChainId(caipChainId)
  return parseInt(chainIdDecimal, 10)
}
