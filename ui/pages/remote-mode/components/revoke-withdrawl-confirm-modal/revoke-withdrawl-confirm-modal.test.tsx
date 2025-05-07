import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../../test/jest/rendering';
import RevokeWithdrawlConfirm, {
  RevokeWithdrawlConfirmModalType,
} from './revoke-withdrawl-confirm-modal.component';

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
    <RevokeWithdrawlConfirm
      {...props}
      type={RevokeWithdrawlConfirmModalType.Swap}
    />,
    store,
  );
};

describe('RevokeWithdrawlConfirm Component', () => {
  it('should render correctly', () => {
    expect(() => {
      renderComponent();
    }).not.toThrow();
  });
});
