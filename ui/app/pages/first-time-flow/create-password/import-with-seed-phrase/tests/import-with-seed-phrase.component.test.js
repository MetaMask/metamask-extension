import assert from 'assert'
import React from 'react'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import ImportWithSeedPhrase from '../import-with-seed-phrase.component'

function shallowRender(props = {}, context = {}) {
  return shallow(<ImportWithSeedPhrase {...props} />, {
    context: {
      t: (str) => `${str}_t`,
      metricsEvent: sinon.spy(),
      ...context,
    },
  })
}

describe('ImportWithSeedPhrase Component', function () {
  it('should render without error', function () {
    const root = shallowRender({
      onSubmit: sinon.spy(),
    })
    const textareaCount = root.find('.first-time-flow__textarea').length
    assert.equal(textareaCount, 1, 'should render 12 seed phrases')
  })

  describe('parseSeedPhrase', function () {
    it('should handle a regular seed phrase', function () {
      const root = shallowRender({
        onSubmit: sinon.spy(),
      })

      const { parseSeedPhrase } = root.instance()

      assert.deepEqual(parseSeedPhrase('foo bar baz'), 'foo bar baz')
    })

    it('should handle a mixed-case seed phrase', function () {
      const root = shallowRender({
        onSubmit: sinon.spy(),
      })

      const { parseSeedPhrase } = root.instance()

      assert.deepEqual(parseSeedPhrase('FOO bAr baZ'), 'foo bar baz')
    })

    it('should handle an upper-case seed phrase', function () {
      const root = shallowRender({
        onSubmit: sinon.spy(),
      })

      const { parseSeedPhrase } = root.instance()

      assert.deepEqual(parseSeedPhrase('FOO BAR BAZ'), 'foo bar baz')
    })

    it('should trim extraneous whitespace from the given seed phrase', function () {
      const root = shallowRender({
        onSubmit: sinon.spy(),
      })

      const { parseSeedPhrase } = root.instance()

      assert.deepEqual(parseSeedPhrase('  foo   bar   baz  '), 'foo bar baz')
    })

    it('should return an empty string when given a whitespace-only string', function () {
      const root = shallowRender({
        onSubmit: sinon.spy(),
      })

      const { parseSeedPhrase } = root.instance()

      assert.deepEqual(parseSeedPhrase('   '), '')
    })

    it('should return an empty string when given a string with only symbols', function () {
      const root = shallowRender({
        onSubmit: sinon.spy(),
      })

      const { parseSeedPhrase } = root.instance()

      assert.deepEqual(parseSeedPhrase('$'), '')
    })

    it('should return an empty string for both null and undefined', function () {
      const root = shallowRender({
        onSubmit: sinon.spy(),
      })

      const { parseSeedPhrase } = root.instance()

      assert.deepEqual(parseSeedPhrase(undefined), '')
      assert.deepEqual(parseSeedPhrase(null), '')
    })
  })
})
