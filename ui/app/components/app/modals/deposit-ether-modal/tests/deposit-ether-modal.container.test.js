import React from 'react'
import { PropTypes } from 'prop-types'
import configureMockStore from 'redux-mock-store'
import assert from 'assert'
import { mount } from 'enzyme'
import DepositEtherModal from '../index'

describe('Deposit Ether Modal Container', function () {
  let wrapper

  const mockStore = {
    metamask: {
      network: '1',
      selectedAddress: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
    },
  }

  const store = configureMockStore()(mockStore)

  beforeEach(function () {
    wrapper = mount(
      <DepositEtherModal store={store} />, {
        context: {
          t: (str) => str,
        },
        childContextTypes: {
          t: PropTypes.func,
        },
      }
    )
  })

  it('renders', function () {
    assert.equal(wrapper.length, 1)
  })

  it('render deposit ether page title', function () {
    const pageTitle = (wrapper.find('.page-container__title'))

    assert.equal(pageTitle.text(), 'depositEther')
  })
})
