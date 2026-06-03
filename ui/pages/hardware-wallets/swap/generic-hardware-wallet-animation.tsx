import React, { useCallback, useEffect, useRef } from 'react';
import {
  Alignment,
  Fit,
  Layout,
  StateMachineInput,
  useRive,
  useRiveFile,
} from '@rive-app/react-canvas';
import { Box } from '@metamask/design-system-react';

import {
  useRiveWasmContext,
  useRiveWasmFile,
} from '../../../contexts/rive-wasm';
import { HardwareWalletSignatureStatus } from './hardware-wallet-signatures-state-machine';

const GENERIC_HARDWARE_WALLET_RIVE_URL =
  './images/riv_animations/generic_hardware_wallet.riv';
const GENERIC_HARDWARE_WALLET_STATE_MACHINE = 'wallet_states';
const GenericHardwareWalletStateInputs = {
  Reset: 'reset',
  WalletLocked: 'wallet_locked',
  Error: 'error',
  Found: 'found',
} as const;

type GenericHardwareWalletAnimationInput =
  (typeof GenericHardwareWalletStateInputs)[keyof typeof GenericHardwareWalletStateInputs];

const GenericHardwareWalletInputByStatus: Record<
  HardwareWalletSignatureStatus,
  GenericHardwareWalletAnimationInput
> = {
  [HardwareWalletSignatureStatus.AwaitingFirstSignature]:
    GenericHardwareWalletStateInputs.Reset,
  [HardwareWalletSignatureStatus.AwaitingFinalSignature]:
    GenericHardwareWalletStateInputs.Reset,
  [HardwareWalletSignatureStatus.Submitted]:
    GenericHardwareWalletStateInputs.Found,
  [HardwareWalletSignatureStatus.Rejected]:
    GenericHardwareWalletStateInputs.WalletLocked,
  [HardwareWalletSignatureStatus.Failed]:
    GenericHardwareWalletStateInputs.Error,
  [HardwareWalletSignatureStatus.Disconnected]:
    GenericHardwareWalletStateInputs.WalletLocked,
};

const GenericHardwareWalletLayout = new Layout({
  fit: Fit.Contain,
  alignment: Alignment.Center,
});

const GenericHardwareWalletAnimation = ({
  status,
}: {
  status: HardwareWalletSignatureStatus;
}) => {
  const { isWasmReady, error: wasmError } = useRiveWasmContext();
  const {
    buffer,
    error: bufferError,
    loading: bufferLoading,
  } = useRiveWasmFile(GENERIC_HARDWARE_WALLET_RIVE_URL);
  const inputsRef = useRef<Record<string, StateMachineInput | undefined>>({});
  const isInitializedRef = useRef(false);
  const lastInputNameRef = useRef<GenericHardwareWalletAnimationInput>();

  useEffect(() => {
    if (wasmError) {
      console.error('[Rive] Failed to load WASM:', wasmError);
    }
    if (bufferError) {
      console.error('[Rive] Failed to load buffer:', bufferError);
    }
  }, [wasmError, bufferError]);

  const { riveFile, status: riveFileStatus } = useRiveFile({
    buffer,
  });

  const { rive, RiveComponent } = useRive({
    riveFile: riveFile ?? undefined,
    stateMachines: riveFile ? GENERIC_HARDWARE_WALLET_STATE_MACHINE : undefined,
    autoplay: false,
    layout: GenericHardwareWalletLayout,
  });

  const cacheInputs = useCallback(() => {
    if (!rive) {
      return false;
    }

    const inputs = rive.stateMachineInputs(
      GENERIC_HARDWARE_WALLET_STATE_MACHINE,
    );
    if (!inputs) {
      return false;
    }

    inputsRef.current = Object.values(GenericHardwareWalletStateInputs).reduce<
      Record<string, StateMachineInput | undefined>
    >(
      (cachedInputs, inputName) => ({
        ...cachedInputs,
        [inputName]: inputs.find((input) => input.name === inputName),
      }),
      {},
    );

    return true;
  }, [rive]);

  useEffect(() => {
    const shouldInitialize =
      rive &&
      isWasmReady &&
      !bufferLoading &&
      buffer &&
      !isInitializedRef.current;

    if (shouldInitialize && cacheInputs()) {
      const inputName = GenericHardwareWalletInputByStatus[status];
      inputsRef.current[inputName]?.fire();
      lastInputNameRef.current = inputName;
      rive.play();
      isInitializedRef.current = true;
    }
  }, [rive, isWasmReady, bufferLoading, buffer, cacheInputs, status]);

  useEffect(() => {
    if (!isInitializedRef.current || !rive) {
      return;
    }

    const inputName = GenericHardwareWalletInputByStatus[status];
    if (lastInputNameRef.current === inputName) {
      return;
    }

    inputsRef.current[inputName]?.fire();
    lastInputNameRef.current = inputName;
  }, [rive, status]);

  useEffect(() => {
    return () => {
      if (rive) {
        rive.cleanup();
      }
      isInitializedRef.current = false;
      lastInputNameRef.current = undefined;
    };
  }, [rive]);

  if (
    !isWasmReady ||
    bufferLoading ||
    !buffer ||
    riveFileStatus === 'loading' ||
    riveFileStatus === 'failed'
  ) {
    return (
      <Box
        className="hardware-wallet-signatures__device-animation"
        data-testid="generic-hardware-wallet-animation-loading"
      />
    );
  }

  return (
    <Box
      className="hardware-wallet-signatures__device-animation"
      data-testid="generic-hardware-wallet-animation"
    >
      <RiveComponent className="hardware-wallet-signatures__device-animation-canvas" />
    </Box>
  );
};

export default GenericHardwareWalletAnimation;
