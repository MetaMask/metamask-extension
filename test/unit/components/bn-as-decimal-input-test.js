var assert = require('assert')

const additions = require('react-testutils-additions')
const h = require('react-hyperscript')
const ReactTestUtils = require('react-addons-test-utils')
const ethUtil = require('ethereumjs-util')
const BN = ethUtil.BN

var BnInput = require('../../../ui/app/components/bn-as-decimal-input')

describe.only('BnInput', function () {
  let bnInput
  const message = 'Hello, world!'
  const buffer = new Buffer(message, 'utf8')
  const hex = buffer.toString('hex')

  it('can tolerate a large number at a high precision', function (done) {

    const renderer = ReactTestUtils.createRenderer();

    let valueStr = '1'
    while (valueStr.length < 18 + 7) {
      valueStr += '0'
    }
    const value = new BN(valueStr, 10)

    let inputStr = '11'
    while (inputStr.length < 7) {
      inputStr += '0'
    }
    inputStr += '.01'

    let targetStr = inputStr.split('.').join()
    while (targetStr.length < 18 + 7) {
      targetStr += '0'
    }
    const target = new BN(targetStr, 10)

    const precision = 1e18 // ether precision

    const props = {
      value,
      precision,
      onChange: (newBn) => {
        assert.equal(newBn.toString(), targetValue.toString(), 'should tolerate increase')
        done()
      }
    }

    const inputComponent = h(BnInput, props)
    const component = additions.renderIntoDocument(inputComponent)
    renderer.render(inputComponent)
    const input = additions.find(component, 'input.hex-input')[0]
    ReactTestUtils.Simulate.change(input, { preventDefault() {}, target: {
      value: inputStr,
      checkValidity() {return true} },
    })
  })
})
