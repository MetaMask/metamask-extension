import { isProviderLimitError } from './is-provider-limit-error';

describe('isProviderLimitError', () => {
  it('matches snapshot for limit and non-limit messages', () => {
    expect({
      minimum: isProviderLimitError('Minimum purchase is 12 EUR'),
      maximum: isProviderLimitError('Maximum purchase is 20 EUR'),
      technical: isProviderLimitError('[object Object]'),
      empty: isProviderLimitError(null),
      vague: isProviderLimitError('Amount is outside the supported range'),
    }).toMatchSnapshot();
  });
});
