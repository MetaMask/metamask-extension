import React from 'react';
import { fireEvent } from '@testing-library/react';

import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../../store/store';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import * as SendContext from '../../../context/send';
import * as UnreliableNetworkRpcHook from '../../../hooks/send/useUnreliableNetworkRpc';
import { SendAlerts } from './send-alerts';

jest.mock('../../../../../hooks/useI18nContext');

describe('SendAlerts', () => {
  const mockUseI18nContext = jest.mocked(useI18nContext);
  const mockStore = configureStore(mockState);

  const defaultProps = {
    isSmartContractAlertOpen: false,
    onSmartContractClose: jest.fn(),
    onSmartContractAcknowledge: jest.fn(),
  };

  const mockNavigateToEditNetwork = jest.fn();

  const mockUnreliableNetworkRpc = (
    overrides: Partial<
      ReturnType<typeof UnreliableNetworkRpcHook.useUnreliableNetworkRpc>
    > = {},
  ) => {
    jest
      .spyOn(UnreliableNetworkRpcHook, 'useUnreliableNetworkRpc')
      .mockReturnValue({
        isUnreliable: false,
        networkName: undefined,
        navigateToEditNetwork: mockNavigateToEditNetwork,
        ...overrides,
      });
  };

  const renderComponent = (propOverrides = {}) =>
    renderWithProvider(
      <SendAlerts {...defaultProps} {...propOverrides} />,
      mockStore,
    );

  beforeEach(() => {
    mockUseI18nContext.mockReturnValue(
      (key: string, substitutions?: string[]) =>
        substitutions?.length
          ? `${key.toUpperCase()}::${substitutions.join(',')}`
          : key.toUpperCase(),
    );
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      chainId: '0x1',
    } as unknown as SendContext.SendContextType);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when neither alert is open', () => {
    mockUnreliableNetworkRpc();
    const { queryByTestId } = renderComponent();

    expect(queryByTestId('send-alert-modal-message')).not.toBeInTheDocument();
  });

  it('auto-opens the network alert when network is unreliable', () => {
    mockUnreliableNetworkRpc({
      isUnreliable: true,
      networkName: 'Ethereum',
    });
    const { getByTestId } = renderComponent();

    expect(getByTestId('send-alert-modal-message')).toHaveTextContent(
      'UNAVAILABLENETWORKCONNECTIONDESCRIPTION::Ethereum',
    );
    expect(
      getByTestId('send-alert-modal-acknowledge-button'),
    ).toHaveTextContent('UPDATE');
  });

  it('closes the network alert when cancel is clicked, but does not re-open while chainId unchanged', () => {
    mockUnreliableNetworkRpc({
      isUnreliable: true,
      networkName: 'Ethereum',
    });
    const { getByTestId, queryByTestId } = renderComponent();

    fireEvent.click(getByTestId('send-alert-modal-cancel-button'));

    expect(queryByTestId('send-alert-modal-message')).not.toBeInTheDocument();
  });

  it('navigates to edit network when Update is clicked', () => {
    mockUnreliableNetworkRpc({
      isUnreliable: true,
      networkName: 'Ethereum',
    });
    const { getByTestId } = renderComponent();

    fireEvent.click(getByTestId('send-alert-modal-acknowledge-button'));

    expect(mockNavigateToEditNetwork).toHaveBeenCalledTimes(1);
  });

  it('renders the smart contract alert when controlled prop is true', () => {
    mockUnreliableNetworkRpc();
    const { getByTestId } = renderComponent({
      isSmartContractAlertOpen: true,
    });

    expect(getByTestId('send-alert-modal-message')).toHaveTextContent(
      'SMARTCONTRACTADDRESSWARNING',
    );
    expect(
      getByTestId('send-alert-modal-acknowledge-button'),
    ).toHaveTextContent('IUNDERSTAND');
  });

  it('forwards smart contract alert acknowledge and close callbacks', () => {
    mockUnreliableNetworkRpc();
    const onSmartContractAcknowledge = jest.fn();
    const onSmartContractClose = jest.fn();
    const { getByTestId } = renderComponent({
      isSmartContractAlertOpen: true,
      onSmartContractAcknowledge,
      onSmartContractClose,
    });

    fireEvent.click(getByTestId('send-alert-modal-acknowledge-button'));
    expect(onSmartContractAcknowledge).toHaveBeenCalledTimes(1);

    fireEvent.click(getByTestId('send-alert-modal-cancel-button'));
    expect(onSmartContractClose).toHaveBeenCalledTimes(1);
  });
});
