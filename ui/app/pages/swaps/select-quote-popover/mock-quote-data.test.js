import quoteDataRows from './mock-quote-data';

describe('quoteDataRows', () => {
  it('matches expected values for quoteDataRows', () => {
    expect(quoteDataRows).toMatchSnapshot();
  });
});
