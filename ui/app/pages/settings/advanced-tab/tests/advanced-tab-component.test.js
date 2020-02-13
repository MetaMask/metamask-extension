import React from 'react'
import assert from 'assert'
import sinon from 'sinon'
import { shallow } from 'enzyme'
import AdvancedTab from '../advanced-tab.component'
import TextField from '../../../../components/ui/text-field'

describe('AdvancedTab Component', function () {
  it('should render correctly when threeBoxFeatureFlag', function () {
    const root = shallow(
      <AdvancedTab
        ipfsGateway=""
        setAutoLockTimeLimit={() => {}}
        setIpfsGateway={() => {}}
        setShowFiatConversionOnTestnetsPreference={() => {}}
        setThreeBoxSyncingPermission={() => {}}
        threeBoxDisabled
        threeBoxSyncingAllowed={false}
      />,
      {
        context: {
          t: s => `_${s}`,
        },
      }
    )

    assert.equal(root.find('.settings-page__content-row').length, 10)
  })

  it('should update autoLockTimeLimit', function () {
    const setAutoLockTimeLimitSpy = sinon.spy()
    const root = shallow(
      <AdvancedTab
        ipfsGateway=""
        setAutoLockTimeLimit={setAutoLockTimeLimitSpy}
        setIpfsGateway={() => {}}
        setShowFiatConversionOnTestnetsPreference={() => {}}
        setThreeBoxSyncingPermission={() => {}}
        threeBoxDisabled
        threeBoxSyncingAllowed={false}
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
    assert.equal(root.state().autoLockTimeLimit, 1440)

    autoTimeout.find('.settings-tab__rpc-save-button').simulate('click')
    assert.equal(setAutoLockTimeLimitSpy.args[0][0], 1440)
  })
})
