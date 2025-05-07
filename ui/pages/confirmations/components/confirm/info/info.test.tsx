import { screen, waitFor } from '@testing-library/react';
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
import { useAssetDetails } from '../../../hooks/useAssetDetails';
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

jest.mock('../../../hooks/useAssetDetails', () => ({
  ...jest.requireActual('../../../hooks/useAssetDetails'),
  useAssetDetails: jest.fn().mockResolvedValue({
    decimals: '4',
  }),
}));

jest.mock('../../../hooks/useTransactionFocusEffect', () => ({
  useTransactionFocusEffect: jest.fn(),
}));

describe('Info', () => {
  const mockedAssetDetails = jest.mocked(useAssetDetails);

  beforeEach(() => {
    mockedAssetDetails.mockImplementation(() => ({
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      decimals: '4' as any,
    }));
  });

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

  it('renders info section for approve request', async () => {
    const state = getMockApproveConfirmState();
    const mockStore = configureMockStore([])(state);
    const { container } = renderWithConfirmContextProvider(<Info />, mockStore);

    await waitFor(() => {
      expect(screen.getByText('Speed')).toBeInTheDocument();
    });

    expect(container).toMatchSnapshot();
  });

  it('renders info section for setApprovalForAll request', async () => {
    const state = getMockSetApprovalForAllConfirmState();
    const mockStore = configureMockStore([])(state);
    const { container } = renderWithConfirmContextProvider(<Info />, mockStore);

    await waitFor(() => {
      expect(screen.getByText('Speed')).toBeInTheDocument();
    });

    expect(container).toMatchSnapshot();
  });
});
