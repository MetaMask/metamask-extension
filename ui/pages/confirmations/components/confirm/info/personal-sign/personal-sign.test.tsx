import React from 'react';
import configureMockStore from 'redux-mock-store';

import mockState from '../../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../../test/lib/render-helpers';
import {
  signatureRequestSIWE,
  unapprovedPersonalSignMsg,
} from '../../../../../../../test/data/confirmations/personal_sign';
import PersonalSignInfo from './personal-sign';

jest.mock(
  '../../../../../../components/app/alert-system/contexts/alertMetricsContext',
  () => ({
    useAlertMetrics: jest.fn(() => ({
      trackAlertMetrics: jest.fn(),
    })),
  }),
);

describe('PersonalSignInfo', () => {
  it('renders correctly for personal sign request', () => {
    const state = {
      ...mockState,
      confirm: {
        currentConfirmation: unapprovedPersonalSignMsg,
      },
    };
    const mockStore = configureMockStore([])(state);
    const { container } = renderWithProvider(<PersonalSignInfo />, mockStore);
    expect(container).toMatchSnapshot();
  });

  it('does not render if required data is not present in the transaction', () => {
    const state = {
      ...mockState,
      confirm: {
        currentConfirmation: {
          id: '0050d5b0-c023-11ee-a0cb-3390a510a0ab',
          status: 'unapproved',
          time: new Date().getTime(),
          type: 'json_request',
        },
      },
    };
    const mockStore = configureMockStore([])(state);
    const { container } = renderWithProvider(<PersonalSignInfo />, mockStore);
    expect(container).toMatchInlineSnapshot(`<div />`);
  });

  it('handle reverse string properly', () => {
    const state = {
      ...mockState,
      confirm: {
        currentConfirmation: {
          id: '0050d5b0-c023-11ee-a0cb-3390a510a0ab',
          status: 'unapproved',
          time: new Date().getTime(),
          type: 'personal_sign',
          securityProviderResponse: null,
          msgParams: {
            from: '0x8eeee1781fd885ff5ddef7789486676961873d12',
            data: '0x5369676e20696e746f20e280ae204556494c',
            origin: 'https://metamask.github.io',
            siwe: { isSIWEMessage: false, parsedMessage: null },
          },
        },
      },
    };
    const mockStore = configureMockStore([])(state);
    const { container } = renderWithProvider(<PersonalSignInfo />, mockStore);
    expect(container).toMatchSnapshot();
  });

  it('display signing in from for SIWE request', () => {
    const state = {
      ...mockState,
      confirm: {
        currentConfirmation: signatureRequestSIWE,
      },
    };
    const mockStore = configureMockStore([])(state);
    const { getByText } = renderWithProvider(<PersonalSignInfo />, mockStore);
    expect(getByText('Signing in with')).toBeDefined();
  });

  it('display simulation for SIWE request if preference useTransactionSimulations is enabled', () => {
    const state = {
      ...mockState,
      metamask: {
        ...mockState.metamask,
        useTransactionSimulations: true,
      },
      confirm: {
        currentConfirmation: signatureRequestSIWE,
      },
    };
    const mockStore = configureMockStore([])(state);
    const { getByText } = renderWithProvider(<PersonalSignInfo />, mockStore);
    expect(getByText('Estimated changes')).toBeDefined();
  });
});
