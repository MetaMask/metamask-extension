// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import React from 'react';
import configureMockStore from 'redux-mock-store';
import { ApprovalType } from '@metamask/controller-utils';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import mockState from '../../../../../test/data/mock-state.json';
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import NetworkConfirmationPopover from './network-confirmation-popover';

describe('NetworkConfirmationPopover', () => {
  const mockUnapprovedConfirmations = [
    {
      id: '1',
      origin: 'metamask',
      type: ApprovalType.AddEthereumChain,
    },
  ];

  const STATE_MOCK = {
    ...mockState,
    unapprovedConfirmations: mockUnapprovedConfirmations,
  };
  const mockStore = configureMockStore([])(STATE_MOCK);

  it('renders popular list component', () => {
    const { container } = renderWithProvider(
      <NetworkConfirmationPopover />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });

  it('does not render the popover when there are no unapproved AddEthereumChain confirmations', () => {
    const emptyStateMock = {
      ...mockState,
      unapprovedConfirmations: [],
    };
    const emptyMockStore = configureMockStore([])(emptyStateMock);

    const { queryByText } = renderWithProvider(
      <NetworkConfirmationPopover />,
      emptyMockStore,
    );
    expect(queryByText('ConfirmationPage content')).not.toBeInTheDocument();
  });
});
