import assert from 'assert';
import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import { Provider } from 'react-redux';
import configureStore from '../../../../store/store';
import testData from '../../../../../../.storybook/test-data';
import ConfirmPageContainerHeader from './confirm-page-container-header.component';

const util = require('../../../../../../app/scripts/lib/util');

describe('Confirm Detail Row Component', function () {
  describe('render', function () {
    it('should render a div with a confirm-page-container-header class', function () {
      const stub = sinon
        .stub(util, 'getEnvironmentType')
        .callsFake(() => 'popup');
      const wrapper = shallow(
        <Provider store={configureStore(testData)}>
          <ConfirmPageContainerHeader
            showEdit={false}
            onEdit={() => {
              // noop
            }}
            showAccountInHeader={false}
            accountAddress="0xmockAccountAddress"
          />
        </Provider>,
      );
      assert.strictEqual(
        wrapper.html().includes('confirm-page-container-header'),
        true,
      );
      stub.restore();
    });

    it('should only render children when fullscreen and showEdit is false', function () {
      const stub = sinon
        .stub(util, 'getEnvironmentType')
        .callsFake(() => 'fullscreen');
      const wrapper = shallow(
        <Provider store={configureStore(testData)}>
          <ConfirmPageContainerHeader
            showEdit={false}
            onEdit={() => {
              // noop
            }}
            showAccountInHeader={false}
            accountAddress="0xmockAccountAddress"
          >
            <div className="nested-test-class" />
          </ConfirmPageContainerHeader>
        </Provider>,
      );
      assert.strictEqual(wrapper.html().includes('nested-test-class'), true);
      assert.strictEqual(
        wrapper.html().includes('confirm-page-container-header'),
        false,
      );
      stub.restore();
    });
  });
});
