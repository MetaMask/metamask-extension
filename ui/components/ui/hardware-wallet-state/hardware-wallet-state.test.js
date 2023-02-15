import React from 'react';
import { act } from '@testing-library/react-hooks';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import HardwareWalletState from '.';

describe('HardwareWalletState Component', () => {
  const mockStore = configureMockStore()(mockState);

  it('should match default snapshot', () => {
    const { container } = renderWithProvider(
      <HardwareWalletState />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });

  it('should render message with locked state', () => {
    const props = {
      initialStatus: 'locked',
    };

    const { container } = renderWithProvider(
      <HardwareWalletState {...props} />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });

  it('should render empty with unlocked state', () => {
    const props = {
      initialStatus: 'unlocked',
    };

    const { container } = renderWithProvider(
      <HardwareWalletState {...props} />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });

  it('should call onUpdate handler', async () => {
    let status = 'unlocked';
    const handler = (state) => {
      status = state;
    };
    // start unlocked and wait to update to locked
    const props = {
      initialStatus: status,
      pollingRateMs: 600,
      onUpdate: handler,
    };
    const { container } = renderWithProvider(
      <HardwareWalletState {...props} />,
      mockStore,
    );
    // should not change until polling commences
    expect(status).toStrictEqual('unlocked');
    // wait for polling to complete (allow time for at least 2 polling cycles)
    await act(() => new Promise((res) => setTimeout(res, 1500)));
    expect(status).toStrictEqual('locked');
    expect(container).toMatchSnapshot();
  });
});
