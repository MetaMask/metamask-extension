import assert from 'assert'
import { mapStateToProps, mapDispatchToProps } from '../advanced-tab.container'

const defaultState = {
  appState: {
    warning: null,
  },
  metamask: {
    featureFlags: {
      sendHexData: false,
      advancedInlineGas: false,
    },
    preferences: {
      autoLogoutTimeLimit: 0,
      showFiatInTestnets: false,
      useNativeCurrencyAsPrimaryCurrency: true,
    },
    threeBoxSyncingAllowed: false,
    threeBoxDisabled: false,
    useNonceField: false,
  },
}

describe('AdvancedTab Container', () => {
  it('should map state to props correctly', () => {
    const props = mapStateToProps(defaultState)
    const expected = {
      warning: null,
      sendHexData: false,
      advancedInlineGas: false,
      showFiatInTestnets: false,
      autoLogoutTimeLimit: 0,
      threeBoxSyncingAllowed: false,
      threeBoxDisabled: false,
      useNonceField: false,
    }

    assert.deepEqual(props, expected)
  })

  it('should map dispatch to props correctly', () => {
    const props = mapDispatchToProps(() => 'mockDispatch')

    assert.ok(typeof props.setHexDataFeatureFlag === 'function')
    assert.ok(typeof props.setRpcTarget === 'function')
    assert.ok(typeof props.displayWarning === 'function')
    assert.ok(typeof props.showResetAccountConfirmationModal === 'function')
    assert.ok(typeof props.setAdvancedInlineGasFeatureFlag === 'function')
    assert.ok(typeof props.setShowFiatConversionOnTestnetsPreference === 'function')
    assert.ok(typeof props.setAutoLogoutTimeLimit === 'function')
    assert.ok(typeof props.setUseNonceField === 'function')
  })
})
