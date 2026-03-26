import {
  useRive,
  useRiveFile,
  // useStateMachineInput,
} from '@rive-app/react-canvas';
import React, { useEffect } from 'react';
import { ThemeType } from '../../../../shared/constants/preferences';
import { useTheme } from '../../../hooks/useTheme';

// const RIVE_ASSET = './images/riv_animations/spinner_loader_with_states.riv';
const SPINNER_STATE_MACHINE = 'SpinnerLoader';
const getAsset = () => {
  return './images/riv_animations/spinner_loader_with_states.riv';
};

export const SPINNER_INPUT = {
  loading: 'Loading',
  success: 'Success',
  error: 'Fail',
};

export type AnimationStatus =
  (typeof SPINNER_INPUT)[keyof typeof SPINNER_INPUT];

export function ToastStatusIcon({ state }: { state: AnimationStatus }) {
  const theme = useTheme();
  const isDark = theme === ThemeType.dark;

  const { riveFile, status } = useRiveFile({
    src: './images/riv_animations/spinner_loader_with_states.riv',
  });

  const { rive, RiveComponent } = useRive({
    riveFile: riveFile ?? undefined,
    stateMachines: riveFile ? SPINNER_STATE_MACHINE : undefined,
  });

  // const darkInput = useStateMachineInput(rive, SPINNER_STATE_MACHINE, 'Dark');

  useEffect(() => {
    // if (!darkInput) {
    //   return;
    // }

    // eslint-disable-next-line react-compiler/react-compiler
    // darkInput.value = isDark;
    rive?.play();
    // }, [rive, darkInput, isDark]);
  }, [rive, isDark]);

  useEffect(() => {
    if (!rive) {
      return;
    }

    const inputs = rive.stateMachineInputs(SPINNER_STATE_MACHINE);
    const trigger = inputs?.find((i) => i.name === state);
    trigger?.fire();
  }, [rive, state]);

  useEffect(() => {
    return () => {
      rive?.cleanup();
    };
  }, [rive]);

  if (status !== 'success') {
    return null;
  }

  return <RiveComponent className="size-6" />;
}
