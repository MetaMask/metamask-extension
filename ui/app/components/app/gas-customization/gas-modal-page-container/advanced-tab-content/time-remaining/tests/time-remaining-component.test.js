import React from 'react'
import assert from 'assert'
import shallow from '../../../../../../../../lib/shallow-with-context'
import TimeRemaining from '../time-remaining.component.js'

describe('TimeRemaining Component', function () {
  let wrapper

  beforeEach(() => {
    wrapper = shallow(<TimeRemaining
      milliseconds={495000}
    />)
  })

  describe('render()', () => {
    it('should render the time-remaining root node', () => {
      assert(wrapper.hasClass('time-remaining'))
    })

    it('should render minutes and seconds numbers and labels', () => {
      const timeRemainingChildren = wrapper.children()
      assert.equal(timeRemainingChildren.length, 4)
      assert.equal(timeRemainingChildren.at(0).text(), 8)
      assert.equal(timeRemainingChildren.at(1).text(), 'minutesShorthand')
      assert.equal(timeRemainingChildren.at(2).text(), 15)
      assert.equal(timeRemainingChildren.at(3).text(), 'secondsShorthand')
    })
  })

})
