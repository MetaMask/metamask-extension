import cleanErrorStack from './cleanErrorStack';

describe('cleanErrorStack', () => {
  const testMessage = 'Test Message';
  const testError = new Error(testMessage);
  const undefinedErrorName = new Error(testMessage);
  const blankErrorName = new Error(testMessage);
  const blankMsgError = new Error();

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (undefinedErrorName as any).name = undefined;
    blankErrorName.name = '';
  });

  it('handles error with message', () => {
    expect(cleanErrorStack(testError).toString()).toStrictEqual(
      'Error: Test Message',
    );
  });

  it('handles error with undefined name', () => {
    expect(cleanErrorStack(undefinedErrorName).toString()).toStrictEqual(
      'Error: Test Message',
    );
  });

  it('handles error with blank name', () => {
    expect(cleanErrorStack(blankErrorName).toString()).toStrictEqual(
      'Test Message',
    );
  });

  it('handles error with blank message', () => {
    expect(cleanErrorStack(blankMsgError).toString()).toStrictEqual('Error');
  });
});

