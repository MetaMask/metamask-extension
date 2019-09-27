import React from 'react'
import assert from 'assert'
import sinon from 'sinon'
import { shallow } from 'enzyme'
import AdvancedTab from '../advanced-tab.component'
import TextField from '../../../../components/ui/text-field'

describe('AdvancedTab Component', () => {
  it('should render correctly when threeBoxFeatureFlag', () => {
    const root = shallow(
      <AdvancedTab />,
      {
        context: {
          t: s => `_${s}`,
        },
      }
    )

    assert.equal(root.find('.settings-page__content-row').length, 9)
  })

  it('should update autoLogoutTimeLimit', () => {
    const setAutoLogoutTimeLimitSpy = sinon.spy()
    const root = shallow(
      <AdvancedTab
        setAutoLogoutTimeLimit={setAutoLogoutTimeLimitSpy}
      />,
      {
        context: {
          t: s => `_${s}`,
        },
      }
    )

    const autoTimeout = root.find('.settings-page__content-row').at(7)
    const textField = autoTimeout.find(TextField)

    textField.props().onChange({ target: { value: 1440 } })
    assert.equal(root.state().autoLogoutTimeLimit, 1440)

    autoTimeout.find('button').simulate('click')
    assert.equal(setAutoLogoutTimeLimitSpy.args[0][0], 1440)
  })
})
