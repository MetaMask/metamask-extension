import {
  consumeUnfundedDepositFunnel,
  isUnfundedDepositFunnelActive,
  markUnfundedDepositFunnel,
} from './unfunded-deposit-funnel';

describe('unfunded-deposit-funnel', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('starts inactive', () => {
    expect(isUnfundedDepositFunnelActive()).toBe(false);
    expect(consumeUnfundedDepositFunnel()).toBe(false);
  });

  it('marks the funnel active', () => {
    markUnfundedDepositFunnel();

    expect(isUnfundedDepositFunnelActive()).toBe(true);
  });

  it('consumes the flag once', () => {
    markUnfundedDepositFunnel();

    expect(consumeUnfundedDepositFunnel()).toBe(true);
    expect(isUnfundedDepositFunnelActive()).toBe(false);
    expect(consumeUnfundedDepositFunnel()).toBe(false);
  });
});
