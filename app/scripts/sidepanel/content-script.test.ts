import browser from 'webextension-polyfill';
import { EXTENSION_MESSAGES } from '../../../shared/constants/messages';
import { onRequestOpenSidepanel } from './content-script';

jest.mock('webextension-polyfill', () => ({
  runtime: {
    sendMessage: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('onRequestOpenSidepanel', () => {
  const sendMessageMock = browser.runtime.sendMessage as jest.Mock;
  const originalUserActivation = navigator.userActivation;

  afterEach(() => {
    Object.defineProperty(navigator, 'userActivation', {
      value: originalUserActivation,
      configurable: true,
    });
  });

  it('ignores REQUEST_OPEN_SIDEPANEL when there is no user gesture', () => {
    Object.defineProperty(navigator, 'userActivation', {
      value: { isActive: false },
      configurable: true,
    });

    onRequestOpenSidepanel({
      type: EXTENSION_MESSAGES.REQUEST_OPEN_SIDEPANEL,
      nonce: 'n1',
    });

    expect(sendMessageMock).not.toHaveBeenCalled();
  });

  it('re-emits OPEN_SIDEPANEL when userActivation is active', () => {
    Object.defineProperty(navigator, 'userActivation', {
      value: { isActive: true },
      configurable: true,
    });

    onRequestOpenSidepanel({
      type: EXTENSION_MESSAGES.REQUEST_OPEN_SIDEPANEL,
      nonce: 'n1',
    });

    expect(sendMessageMock).toHaveBeenCalledWith({
      type: EXTENSION_MESSAGES.OPEN_SIDEPANEL,
      nonce: 'n1',
    });
  });
});
