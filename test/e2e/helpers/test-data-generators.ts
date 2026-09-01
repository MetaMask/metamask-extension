export function generateRandomEmail(): string {
  return `test.user.${Math.random().toString(36).substring(7)}@example.com`;
}

export function generateRandomWalletAddress(): string {
  return `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
}

export function generateRandomTxHash(): string {
  return `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
}

export function generateRandomDescription(): string {
  return `Test claim description ${Math.random().toString(36).substring(7)} - This is a test case for shield claim functionality.`;
}
