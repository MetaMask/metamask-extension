import React, { ReactNode } from 'react';
import { screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { ApprovalType } from '@metamask/controller-utils';
import { renderWithConfirmContextProvider } from '../../../../../test/lib/confirmations/render-helpers';
import { AlertMetricsProvider } from '../../../../components/app/alert-system/contexts/alertMetricsContext';
import { AddEthereumChain } from './add-ethereum-chain';

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

jest.mock('../../hooks/useCurrentConfirmation', () =>
  jest.fn(() => ({ currentConfirmation: mockConfirmation })),
);

function render(component: ReactNode, mockState: Record<string, unknown> = {}) {
  const mockMetrics = {
    trackAlertActionClicked: jest.fn(),
    trackAlertRender: jest.fn(),
    trackInlineAlertClicked: jest.fn(),
  };

  return renderWithConfirmContextProvider(
    <AlertMetricsProvider metrics={mockMetrics}>
      {component}
    </AlertMetricsProvider>,
    configureMockStore([])(mockState),
  );
}

describe('AddEthereumChain', () => {
  it('renders network details with add title', () => {
    const mockState = {
      confirmAlerts: {
        alerts: {},
      },
      metamask: {
        networkConfigurationsByChainId: {},
        subjectMetadata: {},
      },
    };

    render(<AddEthereumChain />, mockState);

    expect(screen.getByText('Add Test Network')).toBeInTheDocument();
    expect(screen.getByText('Test Network')).toBeInTheDocument();
    expect(screen.getByText('example.com')).toBeInTheDocument();
    expect(screen.getByText('rpc.example.com')).toBeInTheDocument();
  });

  it('renders update network title when network exists', () => {
    const mockState = {
      confirmAlerts: {
        alerts: {},
      },
      metamask: {
        networkConfigurationsByChainId: {
          '0x5': { name: 'Existing Network', chainId: '0x5' },
        },
        subjectMetadata: {},
      },
    };

    render(<AddEthereumChain />, mockState);

    expect(screen.getByText('Update Existing Network')).toBeInTheDocument();
  });
});
