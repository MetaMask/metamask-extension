import { screen, waitFor } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import { useParams } from 'react-router-dom-v5-compat';
import {
  getMockAddEthereumChainConfirmState,
  getMockApproveConfirmState,
  getMockContractInteractionConfirmState,
  getMockPersonalSignConfirmState,
  getMockSetApprovalForAllConfirmState,
  getMockTypedSignConfirmState,
  getMockTypedSignPermissionConfirmState,
} from '../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { useAssetDetails } from '../../../hooks/useAssetDetails';
import { isGatorPermissionsFeatureEnabled } from '../../../../../../shared/modules/environment';
import { DEFAULT_ROUTE } from '../../../../../helpers/constants/routes';
import Info from './info';

jest.mock('../../simulation-details/useBalanceChanges', () => ({
  useBalanceChanges: jest.fn(() => ({ pending: false, value: [] })),
}));

jest.mock('./hooks/useBatchApproveBalanceChanges', () => ({
  useBatchApproveBalanceChanges: jest.fn(),
}));

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

jest.mock('../../../../../../shared/modules/environment', () => ({
  ...jest.requireActual('../../../../../../shared/modules/environment'),
  isGatorPermissionsFeatureEnabled: jest.fn().mockReturnValue(true),
}));

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useParams: jest.fn(),
}));

describe('Info', () => {
  const mockedAssetDetails = jest.mocked(useAssetDetails);
  const mockedUseParams = jest.mocked(useParams);
  const MOCK_CONFIRMATION_ID = '1';

  beforeEach(() => {
    mockedAssetDetails.mockImplementation(() => ({
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      decimals: '4' as any,
    }));
    mockedUseParams.mockReturnValue({});
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

  it('renders info section for typed sign request with permission', () => {
    const state = getMockTypedSignPermissionConfirmState();
    const mockStore = configureMockStore([])(state);
    const { container } = renderWithConfirmContextProvider(<Info />, mockStore);
    expect(container).toMatchSnapshot();
  });

  it('throws an error if gator permissions feature is not enabled', () => {
    jest.mocked(isGatorPermissionsFeatureEnabled).mockReturnValue(false);

    const state = getMockTypedSignPermissionConfirmState();
    const mockStore = configureMockStore([])(state);
    expect(() => renderWithConfirmContextProvider(<Info />, mockStore)).toThrow(
      'Gator permissions feature is not enabled',
    );
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

  it('renders info section for addEthereumChain request', () => {
    mockedUseParams.mockReturnValue({ id: MOCK_CONFIRMATION_ID });

    const state = getMockAddEthereumChainConfirmState();
    const mockStore = configureMockStore([])(state);
    renderWithConfirmContextProvider(
      <Info />,
      mockStore,
      DEFAULT_ROUTE,
      MOCK_CONFIRMATION_ID,
    );

    expect(screen.getByText('Test Network')).toBeInTheDocument();
    expect(screen.getByText('example.com')).toBeInTheDocument();
    expect(screen.getByText('rpc.example.com')).toBeInTheDocument();
    expect(screen.getByText('RPC')).toBeInTheDocument();
  });
});
