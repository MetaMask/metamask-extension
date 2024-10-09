import React from 'react';
import configureMockStore from 'redux-mock-store';
import { merge } from 'lodash';
import copyToClipboard from 'copy-to-clipboard';
import mockState from '../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../test/lib/render-helpers';
import { flushPromises } from '../../../test/lib/timer-helpers';
import {
  decryptMsg,
  decryptMsgInline,
  cancelDecryptMsg,
} from '../../store/actions';
import { useScrollRequired } from '../../hooks/useScrollRequired';
import ConfirmDecryptMessage from './confirm-decrypt-message.component';
import { MetaMetricsContext } from '../../contexts/metametrics';

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

jest.mock('../../hooks/useScrollRequired', () => ({
  useScrollRequired: jest.fn(),
}));

jest.mock('../../store/actions', () => ({
  cancelDecryptMsg: jest.fn(),
  decryptMsg: jest.fn(),
  decryptMsgInline: jest.fn(),
}));

jest.mock('copy-to-clipboard', () => ({
  __esModule: true,
  default: jest.fn(),
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
  const mockCopyToClipboard = jest.mocked(copyToClipboard);
  const mockCancelDecryptMsg = jest.mocked(cancelDecryptMsg);
  const mockDecryptMsgInline = jest.mocked(decryptMsgInline);
  const mockDecryptMsg = jest.mocked(decryptMsg);
  const mockUseScrollRequired = jest.mocked(useScrollRequired);
  const mockTrackEvent = jest.fn();

  let store;

  beforeEach(() => {
    jest.clearAllMocks();
    store = configureMockStore()(state);

    mockDecryptMsgInline.mockReturnValue({
      rawSig: mockRawSignatureMessage,
      type: 'DECRYPT_MESSAGE_INLINE',
    });
    mockDecryptMsg.mockReturnValue({
      type: 'DECRYPT_MESSAGE',
    });
    mockCancelDecryptMsg.mockReturnValue({
      type: 'CANCEL_DECRYPT_MESSAGE',
    });

    mockUseScrollRequired.mockReturnValue(mockUseScrollRequiredResult);
  });

  const renderAndUnlockMessage = async () => {
    const result = renderWithProvider(
      <MetaMetricsContext.Provider value={mockTrackEvent}>
        <ConfirmDecryptMessage />
      </MetaMetricsContext.Provider>,
      store,
    );

    const unlockButton = result.getByTestId('message-lock');
    unlockButton.click();
    await flushPromises();
    return result;
  };

  it('matches snapshot', () => {
    const { container } = renderWithProvider(<ConfirmDecryptMessage />, store);
    expect(container).toMatchSnapshot();
  });

  it('matches snapshot if no unapproved decrypt messages', () => {
    const stateWithoutUnapprovedDecryptMsgs = merge({}, mockState);
    stateWithoutUnapprovedDecryptMsgs.metamask.unapprovedDecryptMsgs = [];
    stateWithoutUnapprovedDecryptMsgs.metamask.transactions = [];

    const storeWithoutUnapprovedDecryptMsgs = configureMockStore()(
      stateWithoutUnapprovedDecryptMsgs,
    );

    const { container } = renderWithProvider(
      <ConfirmDecryptMessage />,
      storeWithoutUnapprovedDecryptMsgs,
    );
    expect(container).toMatchSnapshot();
  });

  it('shows error on decrypt inline error', async () => {
    mockDecryptMsgInline.mockReturnValue({
      error: 'Decrypt inline error',
      type: 'DECRYPT_MESSAGE_INLINE',
    });

    const { container } = await renderAndUnlockMessage();

    expect(container).toMatchSnapshot();
  });

  it('decrypt button calls decrypt action and calls metric event', async () => {
    const { getByText } = renderWithProvider(
      <MetaMetricsContext.Provider value={mockTrackEvent}>
        <ConfirmDecryptMessage />
      </MetaMetricsContext.Provider>,
      store,
    );

    const confirmButton = getByText('Decrypt');
    confirmButton.click();
    await flushPromises();

    expect(mockDecryptMsg).toHaveBeenCalled();
    expect(mockTrackEvent).toHaveBeenCalled();
  });

  it('cancel button calls cancel action and calls metric event', async () => {
    const { getByText } = renderWithProvider(
      <MetaMetricsContext.Provider value={mockTrackEvent}>
        <ConfirmDecryptMessage />
      </MetaMetricsContext.Provider>,
      store,
    );

    const confirmButton = getByText('Cancel');
    confirmButton.click();
    await flushPromises();

    expect(mockCancelDecryptMsg).toHaveBeenCalled();
    expect(mockTrackEvent).toHaveBeenCalled();
  });

  it('shows the correct message data', async () => {
    const { container, getByText } = await renderAndUnlockMessage();

    expect(container).toMatchSnapshot();
    expect(getByText(mockRawSignatureMessage)).toBeInTheDocument();
  });

  it('shows the copy button after decrypting inline and calls copy to clipboard on click', async () => {
    const { getByTestId } = await renderAndUnlockMessage();

    const copyButton = getByTestId('message-copy');
    expect(copyButton).toBeInTheDocument();

    copyButton.click();
    expect(mockCopyToClipboard).toHaveBeenCalled();
    expect(mockTrackEvent).toHaveBeenCalled();
  });

  describe('on long message', () => {
    beforeEach(() => {
      mockDecryptMsgInline.mockReturnValue({
        rawSig: mockRawSignatureLongMessage,
        type: 'DECRYPT_MESSAGE_INLINE',
      });
    });

    it('shows scroll to bottom button', async () => {
      mockUseScrollRequired.mockReturnValue(
        merge({}, mockUseScrollRequiredResult, { isScrollable: true }),
      );

      const { getByTestId } = await renderAndUnlockMessage();

      const scrollToBottomButton = getByTestId('scroll-to-bottom');
      expect(scrollToBottomButton).toBeInTheDocument();
    });

    it('confirm action is disabled if scroll not finished', async () => {
      mockUseScrollRequired.mockReturnValue(
        merge({}, mockUseScrollRequiredResult, { isScrollable: true }),
      );

      const { getByText } = await renderAndUnlockMessage();

      const confirmButton = getByText('Decrypt');
      expect(confirmButton).toBeDisabled();
    });

    it('scroll to bottom button click calls scroll to bottom action', async () => {
      const spyScrollToBottomAction = jest.fn();
      mockUseScrollRequired.mockReturnValue(
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
      mockUseScrollRequired.mockReturnValue(
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
