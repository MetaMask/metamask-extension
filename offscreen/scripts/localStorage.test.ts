import { beforeAll } from '@jest/globals';
import { OffscreenCommunicationTarget } from '../../shared/constants/offscreen-communication';
import setupLocalStorageMessageListeners from './localStorage';

const originalGetItem = Storage.prototype.getItem;
const originalSetItem = Storage.prototype.setItem;
const originalRemoveItem = Storage.prototype.removeItem;

describe('setupLocalStorageMessageListeners', () => {
  let mockAddListener: jest.Mock;
  let mockSendMessage: jest.Mock;

  beforeAll(() => {
    Storage.prototype.getItem = jest.fn().mockReturnValue('testValue');
    Storage.prototype.setItem = jest.fn();
    Storage.prototype.removeItem = jest.fn();
  });

  afterAll(() => {
    Storage.prototype.getItem = originalGetItem;
    Storage.prototype.setItem = originalSetItem;
    Storage.prototype.removeItem = originalRemoveItem;
  });

  beforeEach(() => {
    mockAddListener = jest.fn();
    mockSendMessage = jest.fn();

    Object.defineProperty(chrome.runtime, 'onMessage', {
      value: { addListener: mockAddListener },
    });

    Object.defineProperty(chrome.runtime, 'sendMessage', {
      value: mockSendMessage,
    });

    setupLocalStorageMessageListeners();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('adds a listener to chrome.runtime.onMessage', () => {
    expect(mockAddListener).toHaveBeenCalledTimes(1);
  });

  describe('onMessage listener', () => {
    let messageListener: (message: {
      target: string;
      action: string;
      key?: string;
      value?: string;
    }) => void;

    beforeEach(() => {
      messageListener = mockAddListener.mock.calls[0][0];
    });

    it('handles getItem action correctly', () => {
      const mockMessage = {
        target: OffscreenCommunicationTarget.localStorageOffScreen,
        action: 'getItem',
        key: 'testKey',
      };

      const mockStoredValue = 'testValue';

      messageListener(mockMessage);

      expect(window.localStorage.getItem).toHaveBeenCalledWith('testKey');
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        target: OffscreenCommunicationTarget.extensionLocalStorage,
        value: mockStoredValue,
      });
    });

    it('handles setItem action correctly', () => {
      const mockMessage = {
        target: OffscreenCommunicationTarget.localStorageOffScreen,
        action: 'setItem',
        key: 'testKey',
        value: 'testValue',
      };

      messageListener(mockMessage);

      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'testKey',
        'testValue',
      );
    });

    it('handles removeItem action correctly', () => {
      const mockMessage = {
        target: OffscreenCommunicationTarget.localStorageOffScreen,
        action: 'removeItem',
        key: 'testKey',
      };

      messageListener(mockMessage);

      expect(window.localStorage.removeItem).toHaveBeenCalledWith('testKey');
    });

    it('does not process messages with an invalid target', () => {
      const mockMessage = {
        target: 'invalidTarget',
        action: 'getItem',
        key: 'testKey',
      };

      messageListener(mockMessage);

      expect(window.localStorage.getItem).not.toHaveBeenCalled();
      expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
    });

    it('does not process messages with missing fields', () => {
      const mockMessage = {
        target: OffscreenCommunicationTarget.localStorageOffScreen,
        action: 'getItem',
      };

      messageListener(mockMessage);

      expect(window.localStorage.getItem).not.toHaveBeenCalled();
      expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
    });
  });
});
