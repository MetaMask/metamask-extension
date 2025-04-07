import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/jest/rendering';
import RemoteModePermissions from './remote-mode-permissions.component';

type RemoteModePermissionsProps = {
  setStartEnableRemoteSwap?: (startEnableRemoteSwap: boolean) => void;
  setStartEnableDailyAllowance?: (startEnableDailyAllowance: boolean) => void;
};

const defaultProps: RemoteModePermissionsProps = {
  setStartEnableRemoteSwap: () => undefined,
  setStartEnableDailyAllowance: () => undefined,
};

const renderComponent = (props: RemoteModePermissionsProps = defaultProps) => {
  const store = configureMockStore([])({
    metamask: {},
  });
  return renderWithProvider(<RemoteModePermissions {...props} />, store);
};

describe('RemoteModePermissions Component', () => {
  it('should render correctly', () => {
    expect(() => {
      renderComponent(defaultProps);
    }).not.toThrow();
  });

  it('should render the permissions title and description', () => {
    const { queryByText } = renderComponent(defaultProps);
    expect(queryByText('Permissions')).toBeInTheDocument();
    expect(
      queryByText(
        'Safely access your hardware wallet funds without plugging it in. Revoke permissions anytime.',
      ),
    ).toBeInTheDocument();
  });

  it('should render swap and daily allowances sections', () => {
    const { queryByText } = renderComponent(defaultProps);
    expect(queryByText('Swap')).toBeInTheDocument();
    expect(queryByText('Daily allowances')).toBeInTheDocument();
  });

  it('should render enable buttons for both sections', () => {
    const { queryAllByText } = renderComponent(defaultProps);
    const enableButtons = queryAllByText('Enable');
    expect(enableButtons).toHaveLength(2);
  });
});
