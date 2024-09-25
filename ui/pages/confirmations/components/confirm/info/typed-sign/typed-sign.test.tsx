import React from 'react';
import configureMockStore from 'redux-mock-store';

import mockState from '../../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../../test/lib/render-helpers';
import {
  permitSignatureMsg,
  permitSignatureMsgWithNoDeadline,
  unapprovedTypedSignMsgV3,
  unapprovedTypedSignMsgV4,
} from '../../../../../../../test/data/confirmations/typed_sign';
import TypedSignInfo from './typed-sign';

jest.mock(
  '../../../../../../components/app/alert-system/contexts/alertMetricsContext',
  () => ({
    useAlertMetrics: jest.fn(() => ({
      trackAlertMetrics: jest.fn(),
    })),
  }),
);

jest.mock('../../../../../../store/actions', () => {
  return {
    getTokenStandardAndDetails: jest.fn().mockResolvedValue({ decimals: 2 }),
  };
});

describe('TypedSignInfo', () => {
  it('renders origin for typed sign data request', () => {
    const state = {
      ...mockState,
      confirm: {
        currentConfirmation: unapprovedTypedSignMsgV3,
      },
    };
    const mockStore = configureMockStore([])(state);
    const { container } = renderWithProvider(<TypedSignInfo />, mockStore);
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
    const { container } = renderWithProvider(<TypedSignInfo />, mockStore);
    expect(container).toMatchSnapshot();
  });

  it('should render message for typed sign v3 request', () => {
    const state = {
      ...mockState,
      confirm: {
        currentConfirmation: unapprovedTypedSignMsgV3,
      },
    };
    const mockStore = configureMockStore([])(state);
    const { container } = renderWithProvider(<TypedSignInfo />, mockStore);
    expect(container).toMatchSnapshot();
  });

  it('should render message for typed sign v4 request', () => {
    const state = {
      ...mockState,
      confirm: {
        currentConfirmation: unapprovedTypedSignMsgV4,
      },
    };
    const mockStore = configureMockStore([])(state);
    const { container } = renderWithProvider(<TypedSignInfo />, mockStore);
    expect(container).toMatchSnapshot();
  });

  it('display simulation details for permit signature if flag useTransactionSimulations is set', () => {
    const state = {
      ...mockState,
      metamask: {
        ...mockState.metamask,
        useTransactionSimulations: true,
      },
      confirm: {
        currentConfirmation: permitSignatureMsg,
      },
    };
    const mockStore = configureMockStore([])(state);
    const { getByText } = renderWithProvider(<TypedSignInfo />, mockStore);
    expect(getByText('Estimated changes')).toBeDefined();
  });

  it('correctly renders permit sign type', () => {
    const state = {
      ...mockState,
      confirm: {
        currentConfirmation: permitSignatureMsg,
      },
    };
    const mockStore = configureMockStore([])(state);
    const { container } = renderWithProvider(<TypedSignInfo />, mockStore);
    expect(container).toMatchSnapshot();
  });

  it('correctly renders permit sign type with no deadline', () => {
    const state = {
      ...mockState,
      metamask: {
        ...mockState.metamask,
        useTransactionSimulations: true,
      },
      confirm: {
        currentConfirmation: permitSignatureMsgWithNoDeadline,
      },
    };
    const mockStore = configureMockStore([])(state);
    const { container } = renderWithProvider(<TypedSignInfo />, mockStore);
    expect(container).toMatchSnapshot();
  });
});
