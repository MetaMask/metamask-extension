import {
  clearUnfundedDepositFunnel,
  confirmUnfundedDepositFunnel,
  consumeUnfundedDepositFunnel,
  isUnfundedDepositFunnelActive,
  markUnfundedDepositFunnel,
} from './unfunded-deposit-funnel';

const ADDRESS = '0xb9b9e1c2d011c8edbef8f56b40c1901d1a0742c2';
const OTHER_ADDRESS = '0x1111111111111111111111111111111111111111';

describe('unfunded-deposit-funnel', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('starts inactive', () => {
    expect(isUnfundedDepositFunnelActive(ADDRESS)).toBe(false);
    expect(consumeUnfundedDepositFunnel(ADDRESS)).toBe(false);
  });

  it('marks the funnel active for the address that started it', () => {
    markUnfundedDepositFunnel(ADDRESS);

    expect(isUnfundedDepositFunnelActive(ADDRESS)).toBe(true);
    expect(isUnfundedDepositFunnelActive(OTHER_ADDRESS)).toBe(false);
  });

  it('does not report a joinable funnel until a deposit confirms', () => {
    markUnfundedDepositFunnel(ADDRESS);

    expect(consumeUnfundedDepositFunnel(ADDRESS)).toBe(false);
  });

  it('consumes a confirmed funnel once', () => {
    markUnfundedDepositFunnel(ADDRESS);
    confirmUnfundedDepositFunnel(ADDRESS);

    expect(consumeUnfundedDepositFunnel(ADDRESS)).toBe(true);
    expect(isUnfundedDepositFunnelActive(ADDRESS)).toBe(false);
    expect(consumeUnfundedDepositFunnel(ADDRESS)).toBe(false);
  });

  it('does not confirm or consume for a different address', () => {
    markUnfundedDepositFunnel(ADDRESS);
    confirmUnfundedDepositFunnel(OTHER_ADDRESS);

    expect(consumeUnfundedDepositFunnel(OTHER_ADDRESS)).toBe(false);
    expect(consumeUnfundedDepositFunnel(ADDRESS)).toBe(false);
  });

  it('clears an abandoned or failed funnel', () => {
    markUnfundedDepositFunnel(ADDRESS);
    clearUnfundedDepositFunnel();

    expect(isUnfundedDepositFunnelActive(ADDRESS)).toBe(false);
  });

  it('ignores a missing address', () => {
    markUnfundedDepositFunnel(ADDRESS);
    confirmUnfundedDepositFunnel(ADDRESS);

    expect(isUnfundedDepositFunnelActive(undefined)).toBe(false);
    expect(consumeUnfundedDepositFunnel(undefined)).toBe(false);
    expect(consumeUnfundedDepositFunnel(ADDRESS)).toBe(true);
  });
});
