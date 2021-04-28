import quoteDataRows from './mock-quote-data';

describe('quoteDataRows', () => {
  it('matches expected values for quoteDataRows', () => {
    expect(quoteDataRows[0].aggId).toBe('Agg1');
    expect(quoteDataRows[0].amountReceiving).toBe('100 DAI');
    expect(quoteDataRows[1].aggId).toBe('Agg2');
    expect(quoteDataRows[1].amountReceiving).toBe('101 DAI');
    expect(quoteDataRows[2].aggId).toBe('Agg3');
    expect(quoteDataRows[2].amountReceiving).toBe('102 DAI');
    expect(quoteDataRows[3].aggId).toBe('Agg4');
    expect(quoteDataRows[3].amountReceiving).toBe('150 DAI');
    expect(quoteDataRows[4].aggId).toBe('Agg5');
    expect(quoteDataRows[4].amountReceiving).toBe('104 DAI');
    expect(quoteDataRows[5].aggId).toBe('Agg6');
    expect(quoteDataRows[5].amountReceiving).toBe('105 DAI');
  });
});
