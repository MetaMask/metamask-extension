import React from 'react';
import configureMockStore from 'redux-mock-store';
import { merge } from 'lodash';
import mockState from '../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../test/lib/render-helpers';
import { flushPromises } from '../../../test/lib/timer-helpers';
import { decryptMsgInline } from '../../store/actions';
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

jest.mock('../../store/background-connection', () => ({
  ...jest.requireActual('../../store/background-connection'),
  submitRequestToBackground: jest.fn(),
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
  let store;

  beforeEach(() => {
    store = configureMockStore()(state);

    mockedDecryptMsgInline.mockReturnValue({
      rawSig: mockRawSignatureMessage,
      type: 'DECRYPT_MESSAGE',
    });
  });

  it('should match snapshot', () => {
    const { container } = renderWithProvider(<ConfirmDecryptMessage />, store);
    expect(container).toMatchSnapshot();
  });

  it('should show the correct message data', async () => {
    const { container, getByTestId, getByText } = renderWithProvider(
      <ConfirmDecryptMessage />,
      store,
    );
    const unlockButton = getByTestId('message-lock');
    unlockButton.click();
    await flushPromises();

    expect(container).toMatchSnapshot();
    expect(getByText(mockRawSignatureMessage)).toBeInTheDocument();
  });
});
