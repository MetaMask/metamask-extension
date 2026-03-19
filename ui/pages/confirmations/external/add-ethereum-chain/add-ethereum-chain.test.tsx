import React, { ReactNode } from 'react';
import { screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { getMockAddEthereumChainConfirmState } from '../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../test/lib/confirmations/render-helpers';
import { AlertMetricsProvider } from '../../../../components/app/alert-system/contexts/alertMetricsContext';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import { AddEthereumChain } from './add-ethereum-chain';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: '1' }),
}));

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
      ...getMockAddEthereumChainConfirmState(),
      confirmAlerts: {
        alerts: {},
      },
      metamask: {
        ...getMockAddEthereumChainConfirmState().metamask,
        networkConfigurationsByChainId: {},
        subjectMetadata: {},
      },
    };

    render(<AddEthereumChain />, mockState);

    expect(
      screen.getByText(
        messages.addNetworkConfirmationTitle.message.replace(
          '$1',
          'Test Network',
        ),
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Test Network')).toBeInTheDocument();
    expect(screen.getByText('example.com')).toBeInTheDocument();
    expect(screen.getByText('rpc.example.com')).toBeInTheDocument();
  });

  it('renders update network title when network exists', () => {
    const mockState = {
      ...getMockAddEthereumChainConfirmState(),
      confirmAlerts: {
        alerts: {},
      },
      metamask: {
        ...getMockAddEthereumChainConfirmState().metamask,
        networkConfigurationsByChainId: {
          '0x5': { name: 'Existing Network', chainId: '0x5' },
        },
        subjectMetadata: {},
      },
    };

    render(<AddEthereumChain />, mockState);

    expect(
      screen.getByText(
        messages.updateNetworkConfirmationTitle.message.replace(
          '$1',
          'Existing Network',
        ),
      ),
    ).toBeInTheDocument();
  });
});
