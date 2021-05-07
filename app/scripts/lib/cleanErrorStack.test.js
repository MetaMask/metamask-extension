import { strict as assert } from 'assert';
import cleanErrorStack from './cleanErrorStack';

describe('Clean Error Stack', function () {
  const testMessage = 'Test Message';
  const testError = new Error(testMessage);
  const undefinedErrorName = new Error(testMessage);
  const blankErrorName = new Error(testMessage);
  const blankMsgError = new Error();

  beforeEach(function () {
    undefinedErrorName.name = undefined;
    blankErrorName.name = '';
  });

  it('tests error with message', function () {
    assert.equal(cleanErrorStack(testError).toString(), 'Error: Test Message');
  });

  it('tests error with undefined name', function () {
    assert.equal(
      cleanErrorStack(undefinedErrorName).toString(),
      'Error: Test Message',
    );
  });

  it('tests error with blank name', function () {
    assert.equal(cleanErrorStack(blankErrorName).toString(), 'Test Message');
  });

  it('tests error with blank message', function () {
    assert.equal(cleanErrorStack(blankMsgError).toString(), 'Error');
  });
});
