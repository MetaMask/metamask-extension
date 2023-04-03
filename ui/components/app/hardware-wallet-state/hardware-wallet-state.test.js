import React from 'react';
import { act } from '@testing-library/react-hooks';
import configureMockStore from 'redux-mock-store';
import { cloneDeep } from 'lodash';

import { renderWithProvider } from '../../../../test/lib/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import { HardwareWalletStates } from '../../../../shared/constants/hardware-wallets';
import HardwareWalletState from '.';

const customStore = ({ hardwareWalletState } = {}) => {
  const data = cloneDeep({
    ...mockState,
    appState: {
      ...mockState?.appState,
      hardwareWalletState,
    },
  });
  return configureMockStore()(data);
};

describe('HardwareWalletState Component', () => {
  it('should match default snapshot', () => {
    const { container } = renderWithProvider(
      <HardwareWalletState />,
      customStore(),
    );

    expect(container).toMatchSnapshot();
  });

  it('should render message with locked state', () => {
    const { container } = renderWithProvider(
      <HardwareWalletState />,
      customStore({ hardwareWalletState: HardwareWalletStates.locked }),
    );

    expect(container).toMatchSnapshot();
  });

  it('should render empty with unlocked state', () => {
    const { container } = renderWithProvider(
      <HardwareWalletState />,
      customStore({ hardwareWalletState: HardwareWalletStates.unlocked }),
    );

    expect(container).toMatchSnapshot();
  });

  it('should call onUpdate handler', async () => {
    let status = HardwareWalletStates.unlocked;
    const handler = (state) => {
      status = state;
    };
    const props = {
      pollingRateMs: 600,
      onUpdate: handler,
    };
    const { container } = renderWithProvider(
      <HardwareWalletState {...props} />,
      // start unlocked and wait to update to locked
      customStore({ hardwareWalletState: status }),
    );
    // should not change until polling commences
    expect(status).toStrictEqual(HardwareWalletStates.unlocked);

    // wait for polling to complete (allow time for at least 2 polling cycles)
    await act(() => new Promise((res) => setTimeout(res, 1500)));
    expect(status).toStrictEqual(HardwareWalletStates.locked);
    expect(container).toMatchSnapshot();
  });
});
