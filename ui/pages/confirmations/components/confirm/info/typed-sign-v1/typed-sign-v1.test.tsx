import React from 'react';
import configureMockStore from 'redux-mock-store';
import { TransactionType } from '@metamask/transaction-controller';

import { renderWithConfirmContextProvider } from '../../../../../../../test/lib/confirmations/render-helpers';
import { getMockTypedSignConfirmStateForRequest } from '../../../../../../../test/data/confirmations/helper';
import { unapprovedTypedSignMsgV1 } from '../../../../../../../test/data/confirmations/typed_sign';
import TypedSignInfoV1 from './typed-sign-v1';

jest.mock(
  '../../../../../../components/app/alert-system/contexts/alertMetricsContext',
  () => ({
    useAlertMetrics: jest.fn(() => ({
      trackAlertMetrics: jest.fn(),
    })),
  }),
);

describe('TypedSignInfo', () => {
  it('correctly renders typed sign data request', () => {
    const mockState = getMockTypedSignConfirmStateForRequest(
      unapprovedTypedSignMsgV1,
    );
    const mockStore = configureMockStore([])(mockState);
    const { container } = renderWithConfirmContextProvider(
      <TypedSignInfoV1 />,
      mockStore,
    );
    expect(container).toMatchSnapshot();
  });

  it('does not render if required data is not present in the transaction', () => {
    const mockState = getMockTypedSignConfirmStateForRequest({
      id: '123',
      type: TransactionType.signTypedData,
      chainId: '0x5',
    });
    const mockStore = configureMockStore([])(mockState);
    const { container } = renderWithConfirmContextProvider(
      <TypedSignInfoV1 />,
      mockStore,
    );
    expect(container).toMatchInlineSnapshot(`<div />`);
  });
});
