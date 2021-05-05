import configureMockStore from 'redux-mock-store';
import { mount } from 'enzyme';
import React from 'react';
import withModalProps from './with-modal-props';

const mockState = {
  appState: {
    modal: {
      modalState: {
        props: {
          prop1: 'prop1',
          prop2: 2,
          prop3: true,
        },
      },
    },
  },
};

describe('withModalProps', () => {
  it('should return a component wrapped with modal state props', () => {
    const TestComponent = () => <div className="test">Testing</div>;
    const WrappedComponent = withModalProps(TestComponent);
    const store = configureMockStore()(mockState);
    const wrapper = mount(<WrappedComponent store={store} />);

    expect(wrapper).toHaveLength(1);
    const testComponent = wrapper.find(TestComponent).at(0);
    expect(testComponent).toHaveLength(1);
    expect(testComponent.find('.test').text()).toStrictEqual('Testing');
    const testComponentProps = testComponent.props();
    expect(testComponentProps.prop1).toStrictEqual('prop1');
    expect(testComponentProps.prop2).toStrictEqual(2);
    expect(testComponentProps.prop3).toStrictEqual(true);
    expect(typeof testComponentProps.hideModal).toStrictEqual('function');
  });
});
