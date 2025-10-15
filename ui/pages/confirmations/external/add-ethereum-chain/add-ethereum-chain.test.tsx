import React from 'react';
import { screen } from '@testing-library/react';
import { useSelector } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { ApprovalType } from '@metamask/controller-utils';
import { renderWithConfirmContextProvider } from '../../../../../test/lib/confirmations/render-helpers';
import { AddEthereumChain } from './add-ethereum-chain';
import useCurrentConfirmation from '../../hooks/useCurrentConfirmation';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

jest.mock('../../hooks/useCurrentConfirmation', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../../hooks/useConfirmationNavigation', () => ({
  useConfirmationNavigation: jest.fn(() => ({
    confirmations: [{ id: '1' }],
    count: 1,
    navigateToId: jest.fn(),
  })),
}));

jest.mock(
  '../../../../components/app/alert-system/contexts/alertMetricsContext',
  () => ({
    useAlertMetrics: jest.fn(() => ({
      trackAlertMetrics: jest.fn(),
    })),
  }),
);

jest.mock('../../../../hooks/useAlerts', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    getFieldAlerts: jest.fn(() => []),
  })),
}));

const mockConfirmation = {
  id: '1',
  type: ApprovalType.AddEthereumChain,
  origin: 'https://example.com',
  requestData: {
    chainId: '0x5',
    chainName: 'Test Network',
    rpcUrl: 'https://rpc.example.com',
  },
};

describe('AddEthereumChain', () => {
  beforeEach(() => {
    jest.mocked(useCurrentConfirmation).mockReturnValue({
      currentConfirmation: mockConfirmation,
    });
    jest.mocked(useSelector).mockReturnValue({});
  });

  it('renders network details with add title', () => {
    const mockStore = configureMockStore([])({});
    renderWithConfirmContextProvider(<AddEthereumChain />, mockStore);

    expect(screen.getByText(/Add Test Network/i)).toBeInTheDocument();
    expect(
      screen.getByText(/A site is suggesting additional network details/i),
    ).toBeInTheDocument();
    expect(screen.getByText('Test Network')).toBeInTheDocument();
    expect(screen.getByText('example.com')).toBeInTheDocument();
    expect(screen.getByText('rpc.example.com')).toBeInTheDocument();
  });

  it('renders update network title when network exists', () => {
    jest.mocked(useSelector).mockReturnValue({
      '0x5': { name: 'Existing Network', chainId: '0x5' },
    });

    const mockStore = configureMockStore([])({});
    renderWithConfirmContextProvider(<AddEthereumChain />, mockStore);

    expect(screen.getByText(/Update Existing Network/i)).toBeInTheDocument();
  });
});
