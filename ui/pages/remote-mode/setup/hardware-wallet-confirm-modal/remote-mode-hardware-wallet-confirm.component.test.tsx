// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../../test/jest/rendering';
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import RemoteModeHardwareWalletConfirm from './remote-mode-hardware-wallet-confirm.component';

const renderComponent = (
  props = {
    visible: true,
    onConfirm: () => undefined,
    onBack: () => undefined,
    onClose: () => undefined,
  },
) => {
  const store = configureMockStore([])({
    metamask: {},
  });
  return renderWithProvider(
    <RemoteModeHardwareWalletConfirm {...props} />,
    store,
  );
};

describe('RemoteModeHardwareWalletConfirm Component', () => {
  it('should render correctly', () => {
    expect(() => {
      renderComponent();
    }).not.toThrow();
  });
});
