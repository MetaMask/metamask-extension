import {
  clearPendingUnfundedDepositFunnel,
  confirmUnfundedDepositFunnel,
  consumeUnfundedDepositFunnel,
  isUnfundedDepositFunnelActive,
  markDepositResultTracked,
  markUnfundedDepositFunnel,
} from './unfunded-deposit-funnel';

const ADDRESS = '0xb9b9e1c2d011c8edbef8f56b40c1901d1a0742c2';
const OTHER_ADDRESS = '0x1111111111111111111111111111111111111111';

describe('unfunded-deposit-funnel', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
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

  it('keeps a confirmed funnel when the unfunded CTA is clicked again', () => {
    markUnfundedDepositFunnel(ADDRESS);
    confirmUnfundedDepositFunnel(ADDRESS);
    markUnfundedDepositFunnel(ADDRESS);

    expect(consumeUnfundedDepositFunnel(ADDRESS)).toBe(true);
  });

  it('restarts the funnel when a different address clicks after a confirmation', () => {
    markUnfundedDepositFunnel(ADDRESS);
    confirmUnfundedDepositFunnel(ADDRESS);
    markUnfundedDepositFunnel(OTHER_ADDRESS);

    expect(consumeUnfundedDepositFunnel(ADDRESS)).toBe(false);
    expect(consumeUnfundedDepositFunnel(OTHER_ADDRESS)).toBe(false);
  });

  it('does not confirm or consume for a different address', () => {
    markUnfundedDepositFunnel(ADDRESS);
    confirmUnfundedDepositFunnel(OTHER_ADDRESS);

    expect(consumeUnfundedDepositFunnel(OTHER_ADDRESS)).toBe(false);
    expect(consumeUnfundedDepositFunnel(ADDRESS)).toBe(false);
  });

  it('keeps a confirmed funnel when a later deposit fails', () => {
    markUnfundedDepositFunnel(ADDRESS);
    confirmUnfundedDepositFunnel(ADDRESS);
    clearPendingUnfundedDepositFunnel(ADDRESS);

    expect(consumeUnfundedDepositFunnel(ADDRESS)).toBe(true);
  });

  it('drops a pending funnel when its deposit fails', () => {
    markUnfundedDepositFunnel(ADDRESS);
    clearPendingUnfundedDepositFunnel(OTHER_ADDRESS);

    expect(isUnfundedDepositFunnelActive(ADDRESS)).toBe(true);

    clearPendingUnfundedDepositFunnel(ADDRESS);

    expect(isUnfundedDepositFunnelActive(ADDRESS)).toBe(false);
  });

  it('reports a deposit result as new only once', () => {
    expect(markDepositResultTracked('tx-1:1:true')).toBe(true);
    expect(markDepositResultTracked('tx-1:1:true')).toBe(false);
    expect(markDepositResultTracked('tx-2:2:true')).toBe(true);
  });

  it('ignores a missing address', () => {
    markUnfundedDepositFunnel(ADDRESS);
    confirmUnfundedDepositFunnel(ADDRESS);

    expect(isUnfundedDepositFunnelActive(undefined)).toBe(false);
    expect(consumeUnfundedDepositFunnel(undefined)).toBe(false);
    expect(consumeUnfundedDepositFunnel(ADDRESS)).toBe(true);
  });
});
