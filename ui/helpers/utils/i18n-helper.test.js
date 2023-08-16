import React from 'react';
import * as Sentry from '@sentry/browser';
import { getMessage as getMessageShared } from '../../../shared/modules/i18n';
import { renderWithProvider } from '../../../test/lib/render-helpers';
import { getMessage } from './i18n-helper';

jest.mock('../../../shared/modules/i18n');
jest.mock('@sentry/browser');

const localeCodeMock = 'te';
const keyMock = 'testKey';
const localeMessagesMock = { [keyMock]: { message: 'testMessage' } };
const errorMock = new Error('testError');
const messageMock = 'testMessage';

describe('I18N Helper', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('getMessage', () => {
    it('returns value from getMessage in shared module', () => {
      getMessageShared.mockReturnValue(messageMock);

      expect(
        getMessage(localeCodeMock, localeMessagesMock, keyMock),
      ).toStrictEqual(messageMock);

      expect(getMessageShared).toHaveBeenCalledTimes(1);
      expect(getMessageShared).toHaveBeenCalledWith(
        localeCodeMock,
        localeMessagesMock,
        keyMock,
        undefined,
        expect.any(Function),
        undefined,
      );
    });

    it('invokes getMessage from shared module with onError callback that logs Sentry exception', () => {
      getMessage(localeCodeMock, localeMessagesMock, keyMock);

      const onErrorCallback = getMessageShared.mock.calls[0][4];
      onErrorCallback(errorMock);

      expect(Sentry.captureException).toHaveBeenCalledTimes(1);
      expect(Sentry.captureException).toHaveBeenCalledWith(errorMock);
    });

    it('does not provide custom join logic if only strings in substitutions', () => {
      getMessage(localeCodeMock, localeMessagesMock, keyMock, ['a1', 'a2']);

      expect(getMessageShared).toHaveBeenCalledTimes(1);
      expect(getMessageShared).toHaveBeenCalledWith(
        localeCodeMock,
        localeMessagesMock,
        keyMock,
        ['a1', 'a2'],
        expect.any(Function),
        undefined,
      );
    });

    it('renders substitutions inside span if substitutions include React components', () => {
      const substitution1 = (
        <div style={{ color: 'orange' }} key="substitution-1">
          a1
        </div>
      );

      const substitution2 = (
        <div style={{ color: 'pink' }} key="substitution-2">
          b2
        </div>
      );

      const substitution3 = 'c3';

      getMessage(localeCodeMock, localeMessagesMock, keyMock, [
        substitution1,
        substitution2,
        substitution3,
      ]);

      const joinCallback = getMessageShared.mock.calls[0][5];

      const result = joinCallback([
        substitution1,
        substitution2,
        substitution3,
      ]);

      const { container } = renderWithProvider(result);

      expect(container).toMatchSnapshot();
    });
  });
});
