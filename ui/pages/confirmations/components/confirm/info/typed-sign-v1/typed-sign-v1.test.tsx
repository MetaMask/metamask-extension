import React from 'react';
import configureMockStore from 'redux-mock-store';

import { renderWithProvider } from '../../../../../../../test/lib/render-helpers';
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
    const mockState = {
      confirm: {
        currentConfirmation: unapprovedTypedSignMsgV1,
      },
      confirmAlerts: {
        alerts: [],
        confirmed: [],
      },
    };
    const mockStore = configureMockStore([])(mockState);
    const { container } = renderWithProvider(<TypedSignInfoV1 />, mockStore);
    expect(container).toMatchSnapshot();
  });

  it('does not render if required data is not present in the transaction', () => {
    const mockState = {
      confirm: {
        currentConfirmation: {
          id: '0050d5b0-c023-11ee-a0cb-3390a510a0ab',
          status: 'unapproved',
          time: new Date().getTime(),
          type: 'json_request',
        },
      },
      confirmAlerts: {
        alerts: [],
        confirmed: [],
      },
    };
    const mockStore = configureMockStore([])(mockState);
    const { container } = renderWithProvider(<TypedSignInfoV1 />, mockStore);
    expect(container).toMatchInlineSnapshot(`<div />`);
  });
});
