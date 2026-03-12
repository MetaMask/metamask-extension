import React, { useEffect } from 'react';
import { Alignment, Fit, Layout, useRive } from '@rive-app/react-canvas';
import { Toaster as ToasterBase } from 'react-hot-toast';
import { ThemeType } from '../../../../shared/constants/preferences';
import { useTheme } from '../../../hooks/useTheme';
// import { useI18nContext } from '../../../hooks/useI18nContext';

type ToastVariant = 'default' | 'loading' | 'success' | 'error';

function getRiveAssetForVariant() {
  return './images/riv_animations/spinner_loader_with_states.riv';
}

function normalizeVariant(
  variant: ToastVariant,
): 'loading' | 'success' | 'error' {
  if (variant === 'success') {
    return 'success';
  }

  if (variant === 'error') {
    return 'error';
  }

  return 'loading';
}

const SPINNER_STATE_MACHINE = 'SpinnerLoader';

type RiveInput = {
  name?: string;
  value?: boolean | number;
  fire?: () => void;
};

function setInputActive(
  inputs: RiveInput[],
  inputName: string,
  isActive: boolean,
) {
  const input = inputs.find(
    ({ name }) =>
      typeof name === 'string' &&
      name.toLowerCase() === inputName.toLowerCase(),
  );

  if (!input) {
    return;
  }

  if (typeof input.fire === 'function') {
    if (isActive) {
      input.fire();
    }
    return;
  }

  if ('value' in input) {
    if (typeof input.value === 'number') {
      input.value = isActive ? 1 : 0;
    } else {
      input.value = isActive;
    }
  }
}

function applySpinnerState(
  inputs: RiveInput[],
  variant: 'loading' | 'success' | 'error',
) {
  setInputActive(inputs, 'Loading', variant === 'loading');
  setInputActive(inputs, 'Success', variant === 'success');
  setInputActive(inputs, 'Fail', variant === 'error');
}

function applyThemeState(inputs: RiveInput[], isDark: boolean) {
  const darkNames = ['Dark', 'Dark mode', 'IsDark', 'ThemeDark'];

  darkNames.forEach((name) => setInputActive(inputs, name, isDark));
}

export function TransactionToastStatusAnimation({
  variant,
}: {
  variant: ToastVariant;
}) {
  const theme = useTheme();
  const isDark = theme === ThemeType.dark;
  const asset = getRiveAssetForVariant();
  const variantState = normalizeVariant(variant);

  const { rive, RiveComponent } = useRive({
    src: asset,
    stateMachines: SPINNER_STATE_MACHINE,
    autoplay: true,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
    }),
  });

  useEffect(() => {
    if (!rive) {
      return;
    }

    const inputs = rive.stateMachineInputs(
      SPINNER_STATE_MACHINE,
    ) as RiveInput[];
    applyThemeState(inputs ?? [], isDark);
    applySpinnerState(inputs ?? [], variantState);
    rive.play();
  }, [rive, variantState, isDark]);

  useEffect(() => {
    return () => {
      rive?.cleanup();
    };
  }, [rive]);

  const wrapperStyle: React.CSSProperties = {
    width: '32px',
    height: '32px',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <div aria-hidden style={wrapperStyle}>
      <RiveComponent
        style={{
          width: '32px',
          height: '32px',
        }}
      />
    </div>
  );
}

export function Toaster() {
  // const t = useI18nContext();

  // Themed + close "X" button, but animation comes from above
  // return (
  //   <ToasterBase
  //     position="bottom-center"
  //     containerClassName="toast-container"
  //     toastOptions={{
  //       className: 'w-[360px] border border-border-muted',
  //       style: {
  //         background: 'var(--color-background-section)',
  //         color: 'var(--color-text-default)',
  //         borderRadius: 12,
  //         padding: 12,
  //       },
  //     }}
  //   >
  //     {(notification) => (
  //       <ToastBar toast={notification}>
  //         {({ icon, message }) => (
  //           <>
  //             {icon}
  //             {message}

  //             <ButtonIcon
  //               ariaLabel={t('close')}
  //               iconName={IconName.Close}
  //               size={ButtonIconSize.Sm}
  //               onClick={() => toast.dismiss(notification.id)}
  //             />
  //           </>
  //         )}
  //       </ToastBar>
  //     )}
  //   </ToasterBase>
  // );

  // Themed, but no close "X" button
  return (
    <ToasterBase
      position="bottom-center"
      containerClassName="toast-container"
      toastOptions={{
        className: 'w-[360px] border border-border-muted',
        style: {
          background: 'var(--color-background-section)',
          color: 'var(--color-text-default)',
          borderRadius: 12,
          padding: 12,
        },
      }}
    />
  );
}
