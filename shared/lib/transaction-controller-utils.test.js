import { calcGasTotal } from './transactions-controller-utils';

describe('calcGasTotal()', () => {
  it('should correctly compute gasTotal', () => {
    const result = calcGasTotal(12, 15);
    expect(result).toStrictEqual('17a');
  });
});
