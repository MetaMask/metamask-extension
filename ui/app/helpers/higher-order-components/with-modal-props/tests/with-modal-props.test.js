import assert from 'assert'
import configureMockStore from 'redux-mock-store'
import { mount } from 'enzyme'
import React from 'react'
import withModalProps from '../with-modal-props'

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
}

describe('withModalProps', function () {
  it('should return a component wrapped with modal state props', function () {
    const TestComponent = () => <div className="test">Testing</div>
    const WrappedComponent = withModalProps(TestComponent)
    const store = configureMockStore()(mockState)
    const wrapper = mount(<WrappedComponent store={store} />)

    assert.ok(wrapper)
    const testComponent = wrapper.find(TestComponent).at(0)
    assert.equal(testComponent.length, 1)
    assert.equal(testComponent.find('.test').text(), 'Testing')
    const testComponentProps = testComponent.props()
    assert.equal(testComponentProps.prop1, 'prop1')
    assert.equal(testComponentProps.prop2, 2)
    assert.equal(testComponentProps.prop3, true)
    assert.equal(typeof testComponentProps.hideModal, 'function')
  })
})
