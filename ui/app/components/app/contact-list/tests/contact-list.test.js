import React from 'react'
import { Provider } from 'react-redux'
import assert from 'assert'
import sinon from 'sinon'
import configureMockStore from 'redux-mock-store'
import { mountWithRouter } from '../../../../../../test/lib/render-helpers'
import ContactList from '../index'

describe('Contact List', function () {
  let wrapper

  const mockStore = {
    metamask: {},
  }

  const store = configureMockStore()(mockStore)

  const contact1 = { address: '0x80F061544cC398520615B5d3e7A3BedD70cd4510', name: 'fav 5' }
  const contact2 = { address: '0x60F061544cC398520615B5d3e7A3BedD70cd4510', name: 'saved A' }
  const contact3 = { address: '0x70F061544cC398520615B5d3e7A3BedD70cd4510', name: 'Fav 7' }

  const props = {
    searchForContacts: sinon.stub().returns([contact1, contact2]),
    searchForRecents: sinon.stub().returns([contact3]),
    searchForMyAccounts: sinon.stub(),
    selectRecipient: sinon.spy(),
  }

  beforeEach(function () {
    wrapper = mountWithRouter(
      <Provider store={store}>
        <ContactList {...props} />
      </Provider>
    )
  })

  it('sets contact label to first capital letter of contact', function () {
    const fLabel = wrapper.find({ label: 'F' })
    assert.equal(fLabel.find('.send__select-recipient-wrapper__group-item__title').text(), contact1.name)

    const sLabel = wrapper.find({ label: 'S' })
    assert.equal(sLabel.find('.send__select-recipient-wrapper__group-item__title').text(), contact2.name)
  })

  it('shows recent addresses', function () {
    const recentContacts = wrapper.find({ label: 'recents' })

    assert.equal(recentContacts.find('.send__select-recipient-wrapper__group-item__title').text(), contact3.name)

  })

})
