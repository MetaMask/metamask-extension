// Known method IDs for supply/deposit calls
const aaveSupplyMethodId = '0x617ba037';
export const supplyMethodIds = new Set([aaveSupplyMethodId]);

// Known method IDs for withdraw calls
const aaveWithdrawMethodId = '0x69328dec';
export const withdrawMethodIds = new Set([aaveWithdrawMethodId]);

// WETH9-style wrap / unwrap (deposit / withdraw)
export const wrapMethodIds = new Set(['0xd0e30db0']);
export const unwrapMethodIds = new Set(['0x2e1a7d4d']);
