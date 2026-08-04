import extractEthjsErrorMessage from './extractEthjsErrorMessage';

describe('extractEthjsErrorMessage', () => {
  it('returns the original message when it is not an ethjs-rpc error', () => {
    const message = 'Something went wrong';

    expect(extractEthjsErrorMessage(message)).toBe(message);
  });

  it('extracts the trailing error text from an ethjs-rpc payload message', () => {
    const message =
      'Error: [ethjs-rpc] rpc error with payload {"id":1,"jsonrpc":"2.0","method":"eth_sendRawTransaction"} Error: replacement transaction underpriced';

    expect(extractEthjsErrorMessage(message)).toBe(
      'replacement transaction underpriced',
    );
  });
});
