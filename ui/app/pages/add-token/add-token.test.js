import assert from 'assert';
import React from 'react';
import { Provider } from 'react-redux';
import sinon from 'sinon';
import configureMockStore from 'redux-mock-store';
import { mountWithRouter } from '../../../../test/lib/render-helpers';
import AddToken from './add-token.container';

describe('Add Token', function () {
  let wrapper;

  const state = {
    metamask: {
      tokens: [],
    },
  };

  const store = configureMockStore()(state);

  const props = {
    history: {
      push: sinon.stub().callsFake(() => undefined),
    },
    setPendingTokens: sinon.spy(),
    clearPendingTokens: sinon.spy(),
    tokens: [],
    identities: {},
    mostRecentOverviewPage: '/',
    showSearchTab: true,
  };

  describe('Add Token', function () {
    before(function () {
      wrapper = mountWithRouter(
        <Provider store={store}>
          <AddToken.WrappedComponent {...props} />
        </Provider>,
        store,
      );

      wrapper.find({ name: 'customToken' }).simulate('click');
    });

    afterEach(function () {
      props.history.push.reset();
    });

    it('next button is disabled when no fields are populated', function () {
      const nextButton = wrapper.find(
        '.button.btn-secondary.page-container__footer-button',
      );

      assert.strictEqual(nextButton.props().disabled, true);
    });

    it('edits token address', function () {
      const tokenAddress = '0x617b3f8050a0BD94b6b1da02B4384eE5B4DF13F4';
      const event = { target: { value: tokenAddress } };
      const customAddress = wrapper.find('input#custom-address');

      customAddress.simulate('change', event);
      assert.strictEqual(
        wrapper.find('AddToken').instance().state.customAddress,
        tokenAddress,
      );
    });

    it('edits token symbol', function () {
      const tokenSymbol = 'META';
      const event = { target: { value: tokenSymbol } };
      const customAddress = wrapper.find('#custom-symbol');
      customAddress.last().simulate('change', event);

      assert.strictEqual(
        wrapper.find('AddToken').instance().state.customSymbol,
        tokenSymbol,
      );
    });

    it('edits token decimal precision', function () {
      const tokenPrecision = '2';
      const event = { target: { value: tokenPrecision } };
      const customAddress = wrapper.find('#custom-decimals');
      customAddress.last().simulate('change', event);

      assert.strictEqual(
        wrapper.find('AddToken').instance().state.customDecimals,
        tokenPrecision,
      );
    });

    it('next', function () {
      const nextButton = wrapper.find(
        '.button.btn-secondary.page-container__footer-button',
      );
      nextButton.simulate('click');

      assert(props.setPendingTokens.calledOnce);
      assert(props.history.push.calledOnce);
      assert.strictEqual(
        props.history.push.getCall(0).args[0],
        '/confirm-add-token',
      );
    });

    it('cancels', function () {
      const cancelButton = wrapper.find(
        'button.btn-default.page-container__footer-button',
      );
      cancelButton.simulate('click');

      assert(props.clearPendingTokens.calledOnce);
      assert.strictEqual(props.history.push.getCall(0).args[0], '/');
    });
  });
});
