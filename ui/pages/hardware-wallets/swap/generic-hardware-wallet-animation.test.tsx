import React from 'react';
import { render } from '@testing-library/react';
import { useRive, useRiveFile } from '@rive-app/react-canvas';

import { useRiveWasmFile } from '../../../contexts/rive-wasm';
import { HardwareWalletSignatureStatus } from './hardware-wallet-signatures-state-machine';
import GenericHardwareWalletAnimation from './generic-hardware-wallet-animation';

const mockBuffer = new ArrayBuffer(1);
const mockRiveFile = {};
const mockTriggerFires = {
  reset: jest.fn(),
  walletLocked: jest.fn(),
  error: jest.fn(),
  found: jest.fn(),
};

const mockRive = {
  stateMachineInputs: jest.fn(() => [
    {
      name: 'reset',
      fire: mockTriggerFires.reset,
    },
    {
      name: 'wallet_locked',
      fire: mockTriggerFires.walletLocked,
    },
    {
      name: 'error',
      fire: mockTriggerFires.error,
    },
    {
      name: 'found',
      fire: mockTriggerFires.found,
    },
  ]),
  play: jest.fn(),
  cleanup: jest.fn(),
};

jest.mock('@rive-app/react-canvas', () => {
  const ReactActual = jest.requireActual('react');

  return {
    Alignment: {
      Center: 'center',
    },
    Fit: {
      Contain: 'contain',
    },
    Layout: jest.fn().mockImplementation((config) => config),
    useRiveFile: jest.fn(() => ({
      riveFile: mockRiveFile,
      status: 'success',
    })),
    useRive: jest.fn(() => ({
      rive: mockRive,
      RiveComponent: ({ className }: { className: string }) =>
        ReactActual.createElement('canvas', {
          className,
          'data-testid': 'rive-component',
        }),
    })),
  };
});

jest.mock('../../../contexts/rive-wasm', () => ({
  useRiveWasmContext: jest.fn(() => ({
    isWasmReady: true,
    error: undefined,
  })),
  useRiveWasmFile: jest.fn(() => ({
    buffer: mockBuffer,
    loading: false,
    error: undefined,
  })),
}));

describe('GenericHardwareWalletAnimation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the Rive animation in the searching state', () => {
    const { getByTestId } = render(
      <GenericHardwareWalletAnimation
        status={HardwareWalletSignatureStatus.AwaitingFirstSignature}
      />,
    );

    expect(getByTestId('generic-hardware-wallet-animation')).toBeDefined();
    expect(getByTestId('rive-component')).toBeDefined();
    expect(mockTriggerFires.reset).toHaveBeenCalled();
  });

  it('loads the Rive file from the cached WASM buffer', () => {
    render(
      <GenericHardwareWalletAnimation
        status={HardwareWalletSignatureStatus.AwaitingFirstSignature}
      />,
    );

    expect(useRiveWasmFile).toHaveBeenCalledWith(
      './images/riv_animations/generic_hardware_wallet.riv',
    );
    expect(useRiveFile).toHaveBeenCalledWith({ buffer: mockBuffer });
    expect(useRive).toHaveBeenCalledWith(
      expect.not.objectContaining({
        src: expect.anything(),
      }),
    );
    expect(useRive).toHaveBeenCalledWith(
      expect.not.objectContaining({
        artboard: expect.anything(),
      }),
    );
    expect(useRive).toHaveBeenCalledWith(
      expect.objectContaining({
        riveFile: mockRiveFile,
        stateMachines: 'wallet_states',
        autoplay: false,
      }),
    );
  });

  it('fires the found trigger when the transaction is submitted', () => {
    const { rerender } = render(
      <GenericHardwareWalletAnimation
        status={HardwareWalletSignatureStatus.AwaitingFinalSignature}
      />,
    );

    rerender(
      <GenericHardwareWalletAnimation
        status={HardwareWalletSignatureStatus.Submitted}
      />,
    );

    expect(mockTriggerFires.found).toHaveBeenCalled();
  });
});
