import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import ImportWithSeedPhrase from './import-with-seed-phrase.component';

function shallowRender(props = {}, context = {}) {
  return shallow(<ImportWithSeedPhrase {...props} />, {
    context: {
      t: (str) => `${str}_t`,
      metricsEvent: sinon.spy(),
      ...context,
    },
  });
}

describe('ImportWithSeedPhrase Component', () => {
  it('should render without error', () => {
    const root = shallowRender({
      onSubmit: sinon.spy(),
    });
    const textareaCount = root.find('.first-time-flow__textarea').length;
    expect(textareaCount).toStrictEqual(1);
  });

  describe('parseSeedPhrase', () => {
    it('should handle a regular Secret Recovery Phrase', () => {
      const root = shallowRender({
        onSubmit: sinon.spy(),
      });

      const { parseSeedPhrase } = root.instance();

      expect(parseSeedPhrase('foo bar baz')).toStrictEqual('foo bar baz');
    });

    it('should handle a mixed-case Secret Recovery Phrase', () => {
      const root = shallowRender({
        onSubmit: sinon.spy(),
      });

      const { parseSeedPhrase } = root.instance();

      expect(parseSeedPhrase('FOO bAr baZ')).toStrictEqual('foo bar baz');
    });

    it('should handle an upper-case Secret Recovery Phrase', () => {
      const root = shallowRender({
        onSubmit: sinon.spy(),
      });

      const { parseSeedPhrase } = root.instance();

      expect(parseSeedPhrase('FOO BAR BAZ')).toStrictEqual('foo bar baz');
    });

    it('should trim extraneous whitespace from the given Secret Recovery Phrase', () => {
      const root = shallowRender({
        onSubmit: sinon.spy(),
      });

      const { parseSeedPhrase } = root.instance();

      expect(parseSeedPhrase('  foo   bar   baz  ')).toStrictEqual(
        'foo bar baz',
      );
    });

    it('should return an empty string when given a whitespace-only string', () => {
      const root = shallowRender({
        onSubmit: sinon.spy(),
      });

      const { parseSeedPhrase } = root.instance();

      expect(parseSeedPhrase('   ')).toStrictEqual('');
    });

    it('should return an empty string when given a string with only symbols', () => {
      const root = shallowRender({
        onSubmit: sinon.spy(),
      });

      const { parseSeedPhrase } = root.instance();

      expect(parseSeedPhrase('$')).toStrictEqual('');
    });

    it('should return an empty string for both null and undefined', () => {
      const root = shallowRender({
        onSubmit: sinon.spy(),
      });

      const { parseSeedPhrase } = root.instance();

      expect(parseSeedPhrase(undefined)).toStrictEqual('');
      expect(parseSeedPhrase(null)).toStrictEqual('');
    });
  });
});
