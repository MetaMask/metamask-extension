import React, { useCallback, useEffect, useRef } from 'react';
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

// State machine and input names as constants
const STATE_MACHINE_NAME = 'Shield_Icon';
const INPUT_NAMES = {
  MALICIOUS: 'Malicious',
  COVERED: 'Covered',
  PAUSED: 'Paused',
  NOT_COVERED: 'Not_covered',
  DARK: 'Dark',
  START: 'Start',
  DISABLE: 'Disable',
} as const;

type CachedInputs = {
  malicious?: StateMachineInput;
  covered?: StateMachineInput;
  warning?: StateMachineInput;
  notCovered?: StateMachineInput;
  dark?: StateMachineInput;
  start?: StateMachineInput;
  disable?: StateMachineInput;
};

// Set all severity toggles to false to change the animation state
const resetSeverityToggles = (toggles: CachedInputs): void => {
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
  toggles: CachedInputs,
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
  isDisabled = true,
}: {
  severity?: AlertSeverity;
  isDisabled?: boolean;
}) => {
  const theme = useTheme();
  const context = useRiveWasmContext();
  const { isWasmReady, error: wasmError } = context;
  const {
    buffer,
    error: bufferError,
    loading: bufferLoading,
  } = useRiveWasmFile('./images/riv_animations/shield_icon.riv');

  const inputsRef = useRef<CachedInputs>({});

  // Track if animation has been initialized (using ref to avoid triggering watcher effects)
  const isInitializedRef = useRef(false);

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
    stateMachines: riveFile ? STATE_MACHINE_NAME : undefined,
    autoplay: false,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
    }),
  });

  // Cache and initialize state machine inputs
  const cacheInputs = useCallback(() => {
    if (!rive) {
      return false;
    }
    const inputs = rive.stateMachineInputs(STATE_MACHINE_NAME);
    if (!inputs) {
      return false;
    }
    inputsRef.current = {
      malicious: inputs.find((input) => input.name === INPUT_NAMES.MALICIOUS),
      covered: inputs.find((input) => input.name === INPUT_NAMES.COVERED),
      warning: inputs.find((input) => input.name === INPUT_NAMES.PAUSED),
      notCovered: inputs.find(
        (input) => input.name === INPUT_NAMES.NOT_COVERED,
      ),
      disable: inputs.find((input) => input.name === INPUT_NAMES.DISABLE),
      dark: inputs.find((input) => input.name === INPUT_NAMES.DARK),
      start: inputs.find((input) => input.name === INPUT_NAMES.START),
    };
    return true;
  }, [rive]);

  // Initialize Rive once when ready
  useEffect(() => {
    const shouldInitialize =
      rive &&
      isWasmReady &&
      !bufferLoading &&
      buffer &&
      !isInitializedRef.current;
    if (shouldInitialize && cacheInputs()) {
      const { dark } = inputsRef.current;

      // Set the Dark toggle based on current theme
      if (dark) {
        dark.value = theme === ThemeType.dark;
      }

      // Set initial severity
      resetSeverityToggles(inputsRef.current);
      setSeverityToggle(severity, inputsRef.current);

      // Play initial animation if requested
      if (isDisabled) {
        const { disable } = inputsRef.current;
        if (disable) {
          disable.fire();
        }
      } else {
        const { start } = inputsRef.current;
        if (start) {
          start.fire();
        }
      }

      rive.play();

      isInitializedRef.current = true;
    }
    // it's intended to trigger the animation when the rive is loaded
  }, [rive, isWasmReady, bufferLoading, buffer, cacheInputs]);

  // Watch for changes to severity and isDisabled after initialization
  useEffect(() => {
    // Skip if not initialized yet (initialization effect handles the first trigger)
    if (!isInitializedRef.current || !rive) {
      return;
    }

    // Update severity toggles
    resetSeverityToggles(inputsRef.current);
    setSeverityToggle(severity, inputsRef.current);

    // Fire animation on change
    if (isDisabled) {
      const { disable } = inputsRef.current;
      if (disable) {
        disable.fire();
      }
    } else {
      const { start } = inputsRef.current;
      if (start) {
        start.fire();
      }
    }
    // it's intended to trigger the animation when the severity or isDisabled changes
  }, [severity, isDisabled]);

  // Watch for theme changes
  useEffect(() => {
    // Skip if not initialized yet (initialization effect handles the first theme set)
    if (!isInitializedRef.current || !rive) {
      return;
    }

    const { dark } = inputsRef.current;
    if (dark) {
      dark.value = theme === ThemeType.dark;
    }
    // it's intended to trigger the animation when the theme changes
  }, [theme]);

  // Stop animation on unmount or when rive instance changes
  useEffect(() => {
    return () => {
      if (rive) {
        rive.cleanup();
      }
      isInitializedRef.current = false;
    };
    // it's intended to stop the animation when the component unmounts
  }, []);

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
