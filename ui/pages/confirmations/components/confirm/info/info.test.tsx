import React from 'react';
import configureMockStore from 'redux-mock-store';

import {
  getMockApproveConfirmState,
  getMockContractInteractionConfirmState,
  getMockPersonalSignConfirmState,
  getMockSetApprovalForAllConfirmState,
  getMockTypedSignConfirmState,
} from '../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import Info from './info';

jest.mock(
  '../../../../../components/app/alert-system/contexts/alertMetricsContext',
  () => ({
    useAlertMetrics: jest.fn(() => ({
      trackAlertMetrics: jest.fn(),
    })),
  }),
);

jest.mock('../../../../../store/actions', () => ({
  ...jest.requireActual('../../../../../store/actions'),
  getGasFeeTimeEstimate: jest.fn().mockResolvedValue({
    lowerTimeBound: 0,
    upperTimeBound: 60000,
  }),
}));

describe('Info', () => {
  it('renders info section for personal sign request', () => {
    const state = getMockPersonalSignConfirmState();
    const mockStore = configureMockStore([])(state);
    const { container } = renderWithConfirmContextProvider(<Info />, mockStore);
    expect(container).toMatchSnapshot();
  });

  it('renders info section for typed sign request', () => {
    const state = getMockTypedSignConfirmState();
    const mockStore = configureMockStore([])(state);
    const { container } = renderWithConfirmContextProvider(<Info />, mockStore);
    expect(container).toMatchSnapshot();
  });

  it('renders info section for contract interaction request', () => {
    const state = getMockContractInteractionConfirmState();
    const mockStore = configureMockStore([])(state);
    const { container } = renderWithConfirmContextProvider(<Info />, mockStore);
    expect(container).toMatchSnapshot();
  });

  it('renders info section for approve request', () => {
    const state = getMockApproveConfirmState();
    const mockStore = configureMockStore([])(state);
    const { container } = renderWithConfirmContextProvider(<Info />, mockStore);
    expect(container).toMatchSnapshot();
  });

  it('renders info section for setApprovalForAll request', () => {
    const state = getMockSetApprovalForAllConfirmState();
    const mockStore = configureMockStore([])(state);
    const { container } = renderWithConfirmContextProvider(<Info />, mockStore);
    expect(container).toMatchSnapshot();
  });
});
