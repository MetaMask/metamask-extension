// todo
// const assert = require('assert')
// const { createMockStore } = require('redux-test-utils')
// const h = require('react-hyperscript')
// const { shallowWithStore } = require('../../lib/render-helpers')
// import AddToken from '../../../old-ui/app/components/add-token'

// describe('Add Token Screen', function () {
//   let addTokenComponent, store, component
//   const mockState = {
//     metamask: {
//       identities: {
//         '0x7d3517b0d011698406d6e0aed8453f0be2697926': {
//           'address': '0x7d3517b0d011698406d6e0aed8453f0be2697926',
//           'name': 'Add Token Name',
//         },
//       },
//     },
//   }
//   beforeEach(function () {
//     store = createMockStore(mockState)
//     component = shallowWithStore(h(AddToken), store)
//     addTokenComponent = component.dive()
//   })

//   describe('#ValidateInputs', function () {

//     it('Default State', function () {
//       addTokenComponent.instance().validateInputs()
//       const state = addTokenComponent.state()
//       assert.equal(state.warning, 'Address is invalid.Symbol must be between 0 and 10 characters.')
//     })

//     it('Address is a Nifty Wallet Identity', function () {
//       addTokenComponent.setState({
//         customAddress: '0x7d3517b0d011698406d6e0aed8453f0be2697926',
//       })
//       addTokenComponent.instance().validateInputs()
//       const state = addTokenComponent.state()
//       assert.equal(state.warning, 'Personal address detected. Input the token contract address.')
//     })

//   })

//   describe('#HandleCustomDecimalsChange', () => {
//     it('sets correct decimals for 18', () => {
//       addTokenComponent.instance().handleCustomDecimalsChange(18)
//       const state = addTokenComponent.state()
//       assert.equal(state.customDecimals, 18)
//       assert.equal(state.customDecimalsError, null)
//     })

//     it('sets correct decimals for 0', () => {
//       addTokenComponent.instance().handleCustomDecimalsChange(0)
//       const state = addTokenComponent.state()
//       assert.equal(state.customDecimals, 0)
//       assert.equal(state.customDecimalsError, null)
//     })

//     it('sets customDecimalsError for input string', () => {
//       addTokenComponent.instance().handleCustomDecimalsChange('test')
//       const state = addTokenComponent.state()
//       assert.equal(state.customDecimals, '')
//       assert.equal(state.customDecimalsError, 'Decimals must be at least 0, and not over 36.')
//     })

//     it('sets customDecimalsError for input object', () => {
//       addTokenComponent.instance().handleCustomDecimalsChange({})
//       const state = addTokenComponent.state()
//       assert.equal(state.customDecimals, '')
//       assert.equal(state.customDecimalsError, 'Decimals must be at least 0, and not over 36.')
//     })

//     it('sets customDecimalsError for empty input', () => {
//       addTokenComponent.instance().handleCustomDecimalsChange()
//       const state = addTokenComponent.state()
//       assert.equal(state.customDecimals, '')
//       assert.equal(state.customDecimalsError, 'Decimals must be at least 0, and not over 36.')
//     })
//   })

//   describe('#isValidDecimals', () => {
//     it('returns valid status of token decimals', () => {
//       assert.equal(addTokenComponent.instance().isValidDecimals(0), true)
//       assert.equal(addTokenComponent.instance().isValidDecimals(1), true)
//       assert.equal(addTokenComponent.instance().isValidDecimals(18), true)
//       assert.equal(addTokenComponent.instance().isValidDecimals(35), true)
//     })

//     it('returns invalid status of token decimals', () => {
//       assert.equal(addTokenComponent.instance().isValidDecimals(36), false)
//       assert.equal(addTokenComponent.instance().isValidDecimals(-1), false)
//       assert.equal(addTokenComponent.instance().isValidDecimals('test'), false)
//       assert.equal(addTokenComponent.instance().isValidDecimals({}), false)
//       assert.equal(addTokenComponent.instance().isValidDecimals(), false)
//       assert.equal(addTokenComponent.instance().isValidDecimals(null), false)
//       assert.equal(addTokenComponent.instance().isValidDecimals(undefined), false)
//     })
//   })
// })
