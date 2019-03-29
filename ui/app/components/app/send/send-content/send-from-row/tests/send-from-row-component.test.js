import React from 'react'
import assert from 'assert'
import { shallow } from 'enzyme'
import SendFromRow from '../send-from-row.component.js'
import AccountListItem from '../../../account-list-item'
import SendRowWrapper from '../../send-row-wrapper/send-row-wrapper.component'

describe('SendFromRow Component', function () {
  describe('render', () => {
    const wrapper = shallow(
      <SendFromRow
        from={ { address: 'mockAddress' } }
      />,
      { context: { t: str => str + '_t' } }
    )

    it('should render a SendRowWrapper component', () => {
      assert.equal(wrapper.find(SendRowWrapper).length, 1)
    })

    it('should pass the correct props to SendRowWrapper', () => {
      const { label } = wrapper.find(SendRowWrapper).props()
      assert.equal(label, 'from_t:')
    })

    it('should render the FromDropdown with the correct props', () => {
      const { account } = wrapper.find(AccountListItem).props()
      assert.deepEqual(account, { address: 'mockAddress' })
    })
  })
})
