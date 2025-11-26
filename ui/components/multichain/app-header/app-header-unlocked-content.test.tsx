import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import configureStore from '../../../store/store';
import mockDefaultState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { AppHeaderUnlockedContent } from './app-header-unlocked-content';

jest.mock('../../../../shared/lib/trace', () => {
  const actual = jest.requireActual('../../../../shared/lib/trace');
  return {
    ...actual,
    trace: jest.fn(),
    endTrace: jest.fn(),
  };
});

const mockNavigate = jest.fn();

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useNavigate: () => mockNavigate,
  Link: ({
    children,
    to,
    ...props
  }: React.PropsWithChildren<{
    to: string;
  }> &
    React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

describe('AppHeaderUnlockedContent trace', () => {
  const buildStateWithState2 = () => ({
    ...mockDefaultState,
    metamask: {
      ...mockDefaultState.metamask,
      remoteFeatureFlags: {
        enableMultichainAccountsState2: {
          enabled: true,
          featureVersion: '2',
          minimumVersion: '0.0.0',
        },
      },
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls trace ShowAccountList when AccountPicker is clicked in multichain mode', () => {
    const store = configureStore(buildStateWithState2());
    const menuRef = { current: null } as React.RefObject<HTMLButtonElement>;
    renderWithProvider(
      <AppHeaderUnlockedContent
        disableAccountPicker={false}
        menuRef={menuRef}
      />,
      store,
    );

    const accountName = screen.getByText('Account 1');
    fireEvent.click(accountName);

    const traceLib = jest.requireMock('../../../../shared/lib/trace');
    expect(traceLib.trace).toHaveBeenCalledWith(
      expect.objectContaining({ name: traceLib.TraceName.ShowAccountList }),
    );
    expect(mockNavigate).toHaveBeenCalledWith('/account-list');
  });

  it('calls trace ShowAccountAddressList when networks subtitle is clicked', () => {
    const store = configureStore(buildStateWithState2());
    const menuRef = { current: null } as React.RefObject<HTMLButtonElement>;
    renderWithProvider(
      <AppHeaderUnlockedContent
        disableAccountPicker={false}
        menuRef={menuRef}
      />,
      store,
    );

    const networksSubtitleLink = screen.getByTestId(
      'networks-subtitle-test-id',
    );
    fireEvent.click(networksSubtitleLink);

    const traceLib = jest.requireMock('../../../../shared/lib/trace');
    expect(traceLib.trace).toHaveBeenCalledWith(
      expect.objectContaining({
        name: traceLib.TraceName.ShowAccountAddressList,
      }),
    );
  });
});
