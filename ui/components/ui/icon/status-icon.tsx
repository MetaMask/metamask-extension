import { useRive, useStateMachineInput } from '@rive-app/react-canvas';
import React, { useEffect } from 'react';
import cn from 'clsx';
import { ThemeType } from '../../../../shared/constants/preferences';
import { useTheme } from '../../../hooks/useTheme';
import { useRiveFileLavamoat } from '../../../hooks/useRiveFileLavamoat';

const source = './images/riv_animations/spinner_loader_with_states.riv';
const stateMachine = 'SpinnerLoader';

type Props = {
  state: 'loading' | 'success' | 'fail';
  className?: string;
};

export function StatusIcon({ state, className }: Props) {
  const theme = useTheme();
  const isDark = theme === ThemeType.dark;

  const { riveFile, status: fileStatus } = useRiveFileLavamoat({ src: source });
  const { rive, RiveComponent } = useRive({
    riveFile: riveFile ?? undefined,
    stateMachines: riveFile ? stateMachine : undefined,
    autoplay: true,
  });
  const darkInput = useStateMachineInput(rive, stateMachine, 'Dark');

  useEffect(() => {
    if (!darkInput) {
      return;
    }

    try {
      // eslint-disable-next-line react-compiler/react-compiler
      darkInput.value = isDark;
    } catch {
      // Rive WASM runtime may have been cleaned up
    }
  }, [rive, darkInput, isDark]);

  useEffect(() => {
    if (!rive) {
      return;
    }

    try {
      const inputs = rive.stateMachineInputs(stateMachine);
      const trigger = inputs?.find((i) => i.name.toLowerCase() === state);
      trigger?.fire();
    } catch {
      // Rive WASM runtime may have been cleaned up
    }
  }, [rive, state]);

  useEffect(() => {
    return () => {
      rive?.cleanup();
    };
  }, [rive]);

  if (fileStatus !== 'success') {
    return null;
  }

  return <RiveComponent className={cn('size-6', className)} />;
}
