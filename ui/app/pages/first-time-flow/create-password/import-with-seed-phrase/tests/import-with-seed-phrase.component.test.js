import React from 'react'
import assert from 'assert'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import ImportWithSeedPhrase from '../import-with-seed-phrase.component'

function shallowRender (props = {}, context = {}) {
  return shallow(<ImportWithSeedPhrase {...props} />, {
    context: {
      t: str => str + '_t',
      metricsEvent: sinon.spy(),
      ...context,
    },
  })
}

describe('ImportWithSeedPhrase Component', () => {
  it('should render without error', () => {
    const root = shallowRender({
      onSubmit: sinon.spy(),
    })
    const textareaCount = root.find('.first-time-flow__textarea').length
    assert.equal(textareaCount, 1, 'should render 12 seed phrases')
  })

  describe('parseSeedPhrase', () => {
    it('should handle a regular seed phrase', () => {
      const root = shallowRender({
        onSubmit: sinon.spy(),
      })

      const {parseSeedPhrase} = root.instance()

      assert.deepEqual(parseSeedPhrase('foo bar baz'), 'foo bar baz')
    })

    it('should trim extraneous whitespace from the given seed phrase', () => {
      const root = shallowRender({
        onSubmit: sinon.spy(),
      })

      const {parseSeedPhrase} = root.instance()

      assert.deepEqual(parseSeedPhrase('  foo   bar   baz  '), 'foo bar baz')
    })

    it('should return an empty string when given a whitespace-only string', () => {
      const root = shallowRender({
        onSubmit: sinon.spy(),
      })

      const {parseSeedPhrase} = root.instance()

      assert.deepEqual(parseSeedPhrase('   '), '')
    })

    it('should return an empty string when given a string with only symbols', () => {
      const root = shallowRender({
        onSubmit: sinon.spy(),
      })

      const {parseSeedPhrase} = root.instance()

      assert.deepEqual(parseSeedPhrase('$'), '')
    })

    it('should return an empty string for both null and undefined', () => {
      const root = shallowRender({
        onSubmit: sinon.spy(),
      })

      const {parseSeedPhrase} = root.instance()

      assert.deepEqual(parseSeedPhrase(undefined), '')
      assert.deepEqual(parseSeedPhrase(null), '')
    })
  })
})
