var assert = require('assert')

const additions = require('react-testutils-additions')
const h = require('react-hyperscript')
const ReactTestUtils = require('react-addons-test-utils')
const ethUtil = require('ethereumjs-util')
const BN = ethUtil.BN

var BnInput = require('../../../old-ui/app/components/bn-as-decimal-input')

describe('BnInput', function () {
  it('can tolerate a gas decimal number at a high precision', function (done) {
    const renderer = ReactTestUtils.createRenderer()

    let valueStr = '20'
    while (valueStr.length < 20) {
      valueStr += '0'
    }
    const value = new BN(valueStr, 10)

    const inputStr = '2.3'

    let targetStr = '23'
    while (targetStr.length < 19) {
      targetStr += '0'
    }
    const target = new BN(targetStr, 10)

    const precision = 18 // ether precision
    const scale = 18

    const props = {
      value,
      scale,
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
    ReactTestUtils.Simulate.change(input, { preventDefault () {}, target: {
      value: inputStr,
      checkValidity () { return true } },
    })
  })

  it('can tolerate wei precision', function (done) {
    const renderer = ReactTestUtils.createRenderer()

    const valueStr = '1000000000'

    const value = new BN(valueStr, 10)
    const inputStr = '1.000000001'


    const targetStr = '1000000001'

    const target = new BN(targetStr, 10)

    const precision = 9 // gwei precision
    const scale = 9

    const props = {
      value,
      scale,
      precision,
      onChange: (newBn) => {
        assert.equal(newBn.toString(), target.toString(), 'should tolerate increase')
        const reInput = BnInput.prototype.downsize(newBn.toString(), 9, 9)
        assert.equal(reInput.toString(), inputStr, 'should tolerate increase')
        done()
      },
    }

    const inputComponent = h(BnInput, props)
    const component = additions.renderIntoDocument(inputComponent)
    renderer.render(inputComponent)
    const input = additions.find(component, 'input.hex-input')[0]
    ReactTestUtils.Simulate.change(input, { preventDefault () {}, target: {
      value: inputStr,
      checkValidity () { return true } },
    })
  })
})
