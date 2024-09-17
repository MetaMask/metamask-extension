import React from 'react';
import configureMockStore from 'redux-mock-store';
import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';

import {
  getMockConfirmStateForTransaction,
  getMockTypedSignConfirmState,
  getMockTypedSignConfirmStateForRequest,
} from '../../../../../../../test/data/confirmations/helper';
import {
  permitSignatureMsg,
  unapprovedTypedSignMsgV3,
} from '../../../../../../../test/data/confirmations/typed_sign';
import { renderWithConfirmContextProvider } from '../../../../../../../test/lib/confirmations/render-helpers';
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
    const state = getMockTypedSignConfirmState();
    const mockStore = configureMockStore([])(state);
    const { container } = renderWithConfirmContextProvider(
      <TypedSignInfo />,
      mockStore,
    );
    expect(container).toMatchSnapshot();
  });

  it('does not render if required data is not present in the transaction', () => {
    const state = getMockConfirmStateForTransaction({
      id: '0050d5b0-c023-11ee-a0cb-3390a510a0ab',
      status: TransactionStatus.unapproved,
      time: new Date().getTime(),
      type: TransactionType.contractInteraction,
      chainId: '0x5',
    });

    const mockStore = configureMockStore([])(state);
    const { container } = renderWithConfirmContextProvider(
      <TypedSignInfo />,
      mockStore,
    );
    expect(container).toMatchSnapshot();
  });

  it('should render message for typed sign v3 request', () => {
    const state = getMockTypedSignConfirmStateForRequest(
      unapprovedTypedSignMsgV3,
    );
    const mockStore = configureMockStore([])(state);
    const { container } = renderWithConfirmContextProvider(
      <TypedSignInfo />,
      mockStore,
    );
    expect(container).toMatchSnapshot();
  });

  it('should render message for typed sign v4 request', () => {
    const state = getMockTypedSignConfirmState();
    const mockStore = configureMockStore([])(state);
    const { container } = renderWithConfirmContextProvider(
      <TypedSignInfo />,
      mockStore,
    );
    expect(container).toMatchSnapshot();
  });

  it('display simulation details for permit signature if flag useTransactionSimulations is set', () => {
    const state = getMockTypedSignConfirmStateForRequest(permitSignatureMsg, {
      metamask: {
        useTransactionSimulations: true,
      },
    });
    const mockStore = configureMockStore([])(state);
    const { getByText } = renderWithConfirmContextProvider(
      <TypedSignInfo />,
      mockStore,
    );
    expect(getByText('Estimated changes')).toBeDefined();
  });

  it('correctly renders permit sign type', () => {
    const state = getMockTypedSignConfirmStateForRequest(permitSignatureMsg, {
      metamask: {
        useTransactionSimulations: true,
      },
    });
    const mockStore = configureMockStore([])(state);
    const { container } = renderWithConfirmContextProvider(
      <TypedSignInfo />,
      mockStore,
    );
    expect(container).toMatchSnapshot();
  });
});
