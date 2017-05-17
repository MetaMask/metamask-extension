var assert = require('assert')

const additions = require('react-testutils-additions')
const h = require('react-hyperscript')
const ReactTestUtils = require('react-addons-test-utils')
const ethUtil = require('ethereumjs-util')
const BN = ethUtil.BN

var BnInput = require('../../../ui/app/components/bn-as-decimal-input')

describe('BnInput', function () {
  it('can tolerate a gas decimal number at a high precision', function (done) {

    const renderer = ReactTestUtils.createRenderer()

    let valueStr = '20'
    while (valueStr.length < 15) {
      valueStr += '0'
    }
    const value = new BN(valueStr, 10)

    let inputStr = '2.3'

    let targetStr = '23'
    while (targetStr.length < 14) {
      targetStr += '0'
    }
    const target = new BN(targetStr, 10)

    const precision = 1e18 // ether precision

    const props = {
      value,
      precision,
      onChange: (newBn) => {
        assert.equal(newBn.toString(), target.toString(), 'should tolerate increase')
        done()
      },
    }

    const inputComponent = h(BnInput, props)
    const component = additions.renderIntoDocument(inputComponent)
    renderer.render(inputComponent)
    const input = additions.find(component, 'input.hex-input')[0]
    ReactTestUtils.Simulate.change(input, { preventDefault() {}, target: {
      value: inputStr,
      checkValidity() { return true } },
    })
  })
})
