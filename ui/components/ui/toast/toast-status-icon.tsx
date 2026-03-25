import { useRive, useStateMachineInput } from '@rive-app/react-canvas';
import React, { useEffect } from 'react';
import { ThemeType } from '../../../../shared/constants/preferences';
import { useTheme } from '../../../hooks/useTheme';

const RIVE_ASSET = './images/riv_animations/spinner_loader_with_states.riv';
const SPINNER_STATE_MACHINE = 'SpinnerLoader';

export const SPINNER_INPUT = {
  loading: 'Loading',
  success: 'Success',
  error: 'Fail',
};

export type AnimationStatus =
  (typeof SPINNER_INPUT)[keyof typeof SPINNER_INPUT];

export function ToastStatusIcon({ status }: { status: AnimationStatus }) {
  const theme = useTheme();
  const isDark = theme === ThemeType.dark;

  const { rive, RiveComponent } = useRive({
    src: RIVE_ASSET,
    stateMachines: SPINNER_STATE_MACHINE,
  });

  const darkInput = useStateMachineInput(rive, SPINNER_STATE_MACHINE, 'Dark');

  useEffect(() => {
    if (!darkInput) {
      return;
    }

    // eslint-disable-next-line react-compiler/react-compiler
    darkInput.value = isDark;
    rive?.play();
  }, [rive, darkInput, isDark]);

  useEffect(() => {
    if (!rive) {
      return;
    }

    const inputs = rive.stateMachineInputs(SPINNER_STATE_MACHINE);
    const trigger = inputs?.find((i) => i.name === status);
    trigger?.fire();
  }, [rive, status]);

  useEffect(() => {
    return () => {
      rive?.cleanup();
    };
  }, [rive]);

  return <RiveComponent className="size-6" />;
}
