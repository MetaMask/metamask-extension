import React from 'react';
import configureMockStore from 'redux-mock-store';
import { merge } from 'lodash';
import mockState from '../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../test/lib/render-helpers';
import { flushPromises } from '../../../test/lib/timer-helpers';
import { decryptMsgInline } from '../../store/actions';
import { useScrollRequired } from '../../hooks/useScrollRequired';
import ConfirmDecryptMessage from './confirm-decrypt-message.component';

const messageData = {
  domain: {
    chainId: 97,
    name: 'Ether Mail',
    verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
    version: '1',
  },
};
const messageIdMock = '12345';
const messageMock = {
  id: messageIdMock,
  time: 123,
  status: 'unapproved',
  type: 'testType',
  rawSig: undefined,
  data: JSON.stringify(messageData),
  chainId: '0x5',
  msgParams: {
    data: JSON.stringify(messageData),
    from: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
    version: 'V4',
    origin: 'test',
  },
};
const mockRawSignatureMessage = 'raw message';
const mockRawSignatureLongMessage = 'raw message '.repeat(100);
const mockUseScrollRequiredResult = {
  hasScrolledToBottom: false,
  isScrollable: false,
  isScrolledToBottom: false,
  onScroll: jest.fn(),
  scrollToBottom: jest.fn(),
  setHasScrolledToBottom: jest.fn(),
  ref: {
    current: {},
  },
};

jest.mock('../../store/background-connection', () => ({
  ...jest.requireActual('../../store/background-connection'),
  submitRequestToBackground: jest.fn(),
}));

jest.mock('../../hooks/useScrollRequired', () => ({
  useScrollRequired: jest.fn(),
}));

jest.mock('../../store/actions', () => ({
  decryptMsgInline: jest.fn(),
}));

const state = merge({}, mockState, {
  history: {
    mostRecentOverviewPage: '/',
  },
  metamask: {
    unapprovedDecryptMsgs: [messageMock],
  },
});

describe('ConfirmDecryptMessage Component', () => {
  const mockedDecryptMsgInline = jest.mocked(decryptMsgInline);
  const mockedUseScrollRequiredResult = jest.mocked(useScrollRequired);

  let store;

  beforeEach(() => {
    store = configureMockStore()(state);

    mockedDecryptMsgInline.mockReturnValue({
      rawSig: mockRawSignatureMessage,
      type: 'DECRYPT_MESSAGE',
    });

    mockedUseScrollRequiredResult.mockReturnValue(mockUseScrollRequiredResult);
  });

  const renderAndUnlockMessage = async () => {
    const result = renderWithProvider(<ConfirmDecryptMessage />, store);

    const unlockButton = result.getByTestId('message-lock');
    unlockButton.click();
    await flushPromises();
    return result;
  };

  it('matches snapshot', () => {
    const { container } = renderWithProvider(<ConfirmDecryptMessage />, store);
    expect(container).toMatchSnapshot();
  });

  it('shows the correct message data', async () => {
    const { container, getByText } = await renderAndUnlockMessage();

    expect(container).toMatchSnapshot();
    expect(getByText(mockRawSignatureMessage)).toBeInTheDocument();
  });

  describe('on long message', () => {
    beforeEach(() => {
      mockedDecryptMsgInline.mockReturnValue({
        rawSig: mockRawSignatureLongMessage,
        type: 'DECRYPT_MESSAGE',
      });
    });

    it('shows scroll to bottom button', async () => {
      mockedUseScrollRequiredResult.mockReturnValue(
        merge({}, mockUseScrollRequiredResult, { isScrollable: true }),
      );

      const { getByTestId } = await renderAndUnlockMessage();

      const scrollToBottomButton = getByTestId('scroll-to-bottom');
      expect(scrollToBottomButton).toBeInTheDocument();
    });

    it('confirm action is disabled if scroll not finished', async () => {
      mockedUseScrollRequiredResult.mockReturnValue(
        merge({}, mockUseScrollRequiredResult, { isScrollable: true }),
      );

      const { getByText } = await renderAndUnlockMessage();

      const confirmButton = getByText('Decrypt');
      expect(confirmButton).toBeDisabled();
    });

    it('scroll to bottom button click calls scroll to bottom action', async () => {
      const spyScrollToBottomAction = jest.fn();
      mockedUseScrollRequiredResult.mockReturnValue(
        merge({}, mockUseScrollRequiredResult, {
          isScrollable: true,
          scrollToBottom: spyScrollToBottomAction,
        }),
      );

      const { getByTestId } = await renderAndUnlockMessage();

      const scrollToBottomButton = getByTestId('scroll-to-bottom');
      scrollToBottomButton.click();

      expect(spyScrollToBottomAction).toHaveBeenCalled();
    });

    it('enables confirm action if scrolled to bottom', async () => {
      mockedUseScrollRequiredResult.mockReturnValue(
        merge({}, mockUseScrollRequiredResult, {
          isScrollable: true,
          hasScrolledToBottom: true,
          isScrolledToBottom: true,
        }),
      );

      const { getByText } = await renderAndUnlockMessage();

      const confirmButton = getByText('Decrypt');
      expect(confirmButton).not.toBeDisabled();
    });
  });
});
