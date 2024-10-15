import ethereumAccounts from './eth-accounts';

const baseRequest = {
  origin: 'http://test.com',
};

const createMockedHandler = () => {
  const next = jest.fn();
  const end = jest.fn();
  const getAccounts = jest.fn().mockResolvedValue(['0xdead', '0xbeef']);
  const response = {};
  const handler = (request) =>
    ethereumAccounts.implementation(request, response, next, end, {
      getAccounts,
    });

  return {
    response,
    next,
    end,
    getAccounts,
    handler,
  };
};

describe('ethAccountsHandler', () => {
  it('gets sorted eth accounts from the CAIP-25 permission via the getAccounts hook', async () => {
    const { handler, getAccounts } = createMockedHandler();

    await handler(baseRequest);
    expect(getAccounts).toHaveBeenCalled();
  });

  it('returns the accounts', async () => {
    const { handler, response } = createMockedHandler();

    await handler(baseRequest);
    expect(response.result).toStrictEqual(['0xdead', '0xbeef']);
  });
});
