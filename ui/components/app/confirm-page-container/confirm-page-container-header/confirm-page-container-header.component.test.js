import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import { Provider } from 'react-redux';
import configureStore from '../../../../store/store';
import testData from '../../../../../.storybook/test-data';
import ConfirmPageContainerHeader from './confirm-page-container-header.component';

const util = require('../../../../../app/scripts/lib/util');

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useLayoutEffect: jest.requireActual('react').useEffect,
}));

describe('Confirm Detail Row Component', () => {
  describe('render', () => {
    it('should render a div with a confirm-page-container-header class', () => {
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
      expect(wrapper.html()).toContain('confirm-page-container-header');
      stub.restore();
    });

    it('should only render children when fullscreen and showEdit is false', () => {
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
      expect(wrapper.html()).toContain('nested-test-class');
      expect(wrapper.html()).not.toContain('confirm-page-container-header');
      stub.restore();
    });
  });
});
