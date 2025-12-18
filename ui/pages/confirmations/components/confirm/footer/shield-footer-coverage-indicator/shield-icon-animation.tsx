import React, { useCallback, useEffect } from 'react';
import {
  useRive,
  Layout,
  Fit,
  Alignment,
  useRiveFile,
  StateMachineInput,
} from '@rive-app/react-canvas';
import { Box } from '@metamask/design-system-react';
import {
  useRiveWasmContext,
  useRiveWasmFile,
} from '../../../../../../contexts/rive-wasm';
import { AlertSeverity } from '../../../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../../../helpers/constants/design-system';
import { useTheme } from '../../../../../../hooks/useTheme';
import { ThemeType } from '../../../../../../../shared/constants/preferences';

/**
 * Toggle input names in the Rive state machine
 */
const TOGGLE_NAMES = {
  MALICIOUS: 'Malicious',
  COVERED: 'Covered',
  PAUSED: 'Paused',
  NOT_COVERED: 'Not_covered',
} as const;

const findSeverityToggles = (
  inputs: StateMachineInput[],
): {
  malicious?: StateMachineInput;
  covered?: StateMachineInput;
  warning?: StateMachineInput;
  notCovered?: StateMachineInput;
} => {
  return {
    malicious: inputs.find((input) => input.name === TOGGLE_NAMES.MALICIOUS),
    covered: inputs.find((input) => input.name === TOGGLE_NAMES.COVERED),
    warning: inputs.find((input) => input.name === TOGGLE_NAMES.PAUSED),
    notCovered: inputs.find((input) => input.name === TOGGLE_NAMES.NOT_COVERED),
  };
};

// Set all severity toggles to false to change the animation state
const resetSeverityToggles = (toggles: {
  malicious?: StateMachineInput;
  covered?: StateMachineInput;
  warning?: StateMachineInput;
  notCovered?: StateMachineInput;
}): void => {
  if (toggles.malicious) {
    toggles.malicious.value = false;
  }
  if (toggles.covered) {
    toggles.covered.value = false;
  }
  if (toggles.warning) {
    toggles.warning.value = false;
  }
  if (toggles.notCovered) {
    toggles.notCovered.value = false;
  }
};

// Set the appropriate severity toggle based on the alert severity
const setSeverityToggle = (
  severity: AlertSeverity,
  toggles: {
    malicious?: StateMachineInput;
    covered?: StateMachineInput;
    warning?: StateMachineInput;
    notCovered?: StateMachineInput;
  },
): void => {
  if (severity === Severity.Danger && toggles.malicious) {
    toggles.malicious.value = true;
  } else if (severity === Severity.Success && toggles.covered) {
    toggles.covered.value = true;
  } else if (severity === Severity.Warning && toggles.warning) {
    toggles.warning.value = true;
  } else if (toggles.notCovered) {
    toggles.notCovered.value = true;
  }
};

const ShieldIconAnimation = ({
  // TODO: Update with neutral severity
  severity = Severity.Info,
  playAnimation = false,
}: {
  severity?: AlertSeverity;
  playAnimation?: boolean;
}) => {
  const theme = useTheme();
  const context = useRiveWasmContext();
  const { isWasmReady, error: wasmError } = context;
  const {
    buffer,
    error: bufferError,
    loading: bufferLoading,
  } = useRiveWasmFile('./images/riv_animations/shield_icon.riv');

  useEffect(() => {
    if (wasmError) {
      console.error('[Rive] Failed to load WASM:', wasmError);
    }
    if (bufferError) {
      console.error('[Rive] Failed to load buffer:', bufferError);
    }
  }, [wasmError, bufferError]);

  // Use the buffer parameter instead of src
  const { riveFile, status } = useRiveFile({
    buffer,
  });

  // Only initialize Rive after WASM is ready to avoid "source file required" error
  // We always need to provide a valid config to useRive (hooks can't be conditional)
  // but we control when to actually render the component
  const { rive, RiveComponent } = useRive({
    riveFile: riveFile ?? undefined,
    stateMachines: riveFile ? 'Shield_Icon' : undefined,
    autoplay: false,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
    }),
  });

  const updateSeverity = useCallback(
    (inputs: StateMachineInput[]) => {
      if (!inputs) {
        return;
      }

      const toggles = findSeverityToggles(inputs);
      resetSeverityToggles(toggles);
      setSeverityToggle(severity, toggles);
    },
    [severity],
  );

  // Trigger the animation start when rive is loaded
  useEffect(() => {
    if (rive && isWasmReady && !bufferLoading && buffer) {
      const inputs = rive.stateMachineInputs('Shield_Icon');
      if (inputs) {
        updateSeverity(inputs);

        const darkToggle = inputs.find((input) => input.name === 'Dark');
        if (darkToggle && theme === ThemeType.dark) {
          darkToggle.value = true;
        } else if (darkToggle) {
          darkToggle.value = false;
        }

        // Play the state machine
        if (playAnimation) {
          const startTrigger = inputs.find((input) => input.name === 'Start');
          if (startTrigger) {
            startTrigger.fire();
          }
          rive.play();
        }
      }
    }
  }, [
    rive,
    isWasmReady,
    bufferLoading,
    buffer,
    severity,
    playAnimation,
    updateSeverity,
    theme,
  ]);

  // Don't render Rive component until WASM and buffer are ready to avoid errors
  if (
    !isWasmReady ||
    bufferLoading ||
    !buffer ||
    status === 'loading' ||
    status === 'failed'
  ) {
    return <Box className="riv-animation__shield-icon-container"></Box>;
  }

  return (
    <Box className="riv-animation__shield-icon-container">
      <RiveComponent className="riv-animation__canvas" />
    </Box>
  );
};

export default ShieldIconAnimation;
