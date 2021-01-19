import React from 'react'
import assert from 'assert'
import { render } from 'enzyme'
import SelectedAccount from '../selected-account.component'

describe('SelectedAccount Component', function() {
  it('should render checksummed address', function() {
    const wrapper = render(
      <SelectedAccount
        selectedBase32Address="net2999:00ewurc8cnvxa20v1h9e4grf57kgrsz7rgg67862a2"
        selectedIdentity={{ name: 'testName' }}
      />,
      { context: { t: () => {} } }
    )
    // Checksummed version of address is displayed
    assert.equal(
      wrapper.find('.selected-account__address').text(),
      'net2999:00ewur...62a2'
    )
    assert.equal(wrapper.find('.selected-account__name').text(), 'testName')
  })
})
