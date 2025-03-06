import { describe, it, beforeEach, afterEach } from 'mocha';
import sinon from 'sinon';
import { expect } from 'chai';
import * as Sentry from '@sentry/browser';
import { validate as validateUuid } from 'uuid';

// Import the function you want to test
import { setUserIdIfAvailable } from '../../app/scripts/lib/setupSentry';

describe('setupSentry', () => {
  let sentrySetUserStub;
  let consoleLogStub;

  beforeEach(() => {
    // Stub Sentry.setUser method
    sentrySetUserStub = sinon.stub(Sentry, 'setUser');

    // Optionally stub console.log to prevent test output noise
    consoleLogStub = sinon.stub(console, 'log');
  });

  afterEach(() => {
    // Restore all stubs
    sentrySetUserStub.restore();
    consoleLogStub.restore();
    sinon.restore();
  });

  describe('setUserIdIfAvailable', () => {
    it('should set a valid UUID v4 as the Sentry user ID', () => {
      // Call the function
      setUserIdIfAvailable();

      // Verify Sentry.setUser was called
      expect(sentrySetUserStub.calledOnce).to.be.true;

      // Get the argument passed to setUser
      const setUserArg = sentrySetUserStub.firstCall.args[0];

      // Verify it has an id property
      expect(setUserArg).to.have.property('id');

      // Verify the id is a valid UUID v4
      expect(validateUuid(setUserArg.id)).to.be.true;
    });

    it('should handle errors gracefully', () => {
      // Make Sentry.setUser throw an error
      sentrySetUserStub.throws(new Error('Test error'));

      // Function should not throw even when Sentry.setUser fails
      expect(() => setUserIdIfAvailable()).to.not.throw();
    });
  });
});