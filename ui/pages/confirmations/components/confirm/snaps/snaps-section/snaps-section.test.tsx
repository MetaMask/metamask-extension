import React from 'react';
import configureMockStore from 'redux-mock-store';
import { Text } from '@metamask/snaps-sdk/jsx';
import { fireEvent } from '@testing-library/react';

import {
  getMockPersonalSignConfirmState,
  getMockTypedSignConfirmStateForRequest,
} from '../../../../../../../test/data/confirmations/helper';
import { unapprovedPersonalSignMsg } from '../../../../../../../test/data/confirmations/personal_sign';
import { unapprovedTypedSignMsgV3 } from '../../../../../../../test/data/confirmations/typed_sign';
import { renderWithConfirmContextProvider } from '../../../../../../../test/lib/confirmations/render-helpers';
import { SnapsSection } from './snaps-section';

const additionalMockState = {
  insights: {
    [unapprovedPersonalSignMsg.id]: {
      'npm:@metamask/test-snap-bip32': {
        snapId: 'npm:@metamask/test-snap-bip32',
        loading: false,
        interfaceId: 'interface-id',
      },
    },
    [unapprovedTypedSignMsgV3.id]: {
      'npm:@metamask/test-snap-bip32': {
        snapId: 'npm:@metamask/test-snap-bip32',
        loading: false,
        interfaceId: 'interface-id2',
      },
    },
  },
  interfaces: {
    'interface-id': {
      snapId: 'npm:@metamask/test-snap-bip32',
      content: Text({ children: 'Hello world!' }),
      state: {},
      context: null,
    },
    'interface-id2': {
      snapId: 'npm:@metamask/test-snap-bip32',
      content: Text({ children: 'Hello world again!' }),
      state: {},
      context: null,
    },
  },
};

describe('SnapsSection', () => {
  it('renders section personal sign request', () => {
    const state = getMockPersonalSignConfirmState({
      metamask: {
        ...additionalMockState,
      },
    });
    const mockStore = configureMockStore([])(state);
    const { container, getByText } = renderWithConfirmContextProvider(
      <SnapsSection />,
      mockStore,
    );

    fireEvent.click(getByText('Insights from'));

    expect(container).toMatchSnapshot();
    expect(getByText('Hello world!')).toBeDefined();
  });

  it('renders section for typed sign request', () => {
    const state = getMockTypedSignConfirmStateForRequest(
      unapprovedTypedSignMsgV3,
      {
        metamask: {
          ...additionalMockState,
        },
      },
    );
    const mockStore = configureMockStore([])(state);
    const { container, getByText } = renderWithConfirmContextProvider(
      <SnapsSection />,
      mockStore,
    );

    fireEvent.click(getByText('Insights from'));

    expect(container).toMatchSnapshot();
    expect(getByText('Hello world again!')).toBeDefined();
  });
});
