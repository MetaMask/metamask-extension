import React from 'react';
import configureMockStore from 'redux-mock-store';

import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import ConfirmTitle from './signature-message';

const mockPersonalSign = {
  id: '0050d5b0-c023-11ee-a0cb-3390a510a0ab',
  status: 'unapproved',
  time: new Date().getTime(),
  type: 'personal_sign',
  securityProviderResponse: null,
  msgParams: {
    from: '0x8eeee1781fd885ff5ddef7789486676961873d12',
    data: '0x4578616d706c652060706572736f6e616c5f7369676e60206d657373616765',
    origin: 'https://metamask.github.io',
    siwe: { isSIWEMessage: false, parsedMessage: null },
  },
};

describe('SignatureMessage', () => {
  it('should render message for personal sign request', () => {
    const mockState = {
      confirm: {
        currentConfirmation: mockPersonalSign,
      },
    };
    const mockStore = configureMockStore([])(mockState);
    const { getByText } = renderWithProvider(<ConfirmTitle />, mockStore);

    expect(getByText('Message')).toBeInTheDocument();
    expect(getByText('Example `personal_sign` message')).toBeInTheDocument();
  });
});
