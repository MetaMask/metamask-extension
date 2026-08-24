import React, { useLayoutEffect, useRef, useCallback } from 'react';
import classnames from 'clsx';
import {
  Box,
  BoxBackgroundColor,
  BoxFlexDirection,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  usePureBlack,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getEnvironmentType } from '../../../../shared/lib/environment-type';
import {
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_SIDEPANEL,
} from '../../../../shared/constants/app';
import type { GlobalMenuDrawerProps } from './global-menu-drawer.types';

const drawerOpenVar = '--global-drawer-open' as const;

export function preserveDrawerOpen(
  root: HTMLElement = document.documentElement,
) {
  root.style.setProperty(drawerOpenVar, 'none');
}

function clearDrawerOpen(root: HTMLElement = document.documentElement) {
  root.style.removeProperty(drawerOpenVar);
}

const dialogClassNameBase = classnames(
  'group',

  // Reset + clip stencil
  'box-border border-0 bg-transparent p-0',
  'm-0 ms-auto me-[max(0px,calc((100vw-var(--width-max))/2))]',
  'h-full max-h-full w-[min(400px,100%)] overflow-clip [translate:none]',

  // Dialog enter/exit
  'transition-[display,overlay] transition-discrete duration-300 ease-in-out',
  'motion-reduce:duration-[0.01ms]',

  // Backdrop fade
  'backdrop:opacity-0 open:backdrop:opacity-100',
  'backdrop:transition-[opacity,display,overlay] backdrop:transition-discrete',
  'backdrop:duration-[var(--global-drawer-open,300ms)] backdrop:ease-linear',
  'starting:open:backdrop:opacity-0',
  'motion-reduce:backdrop:duration-[0.01ms]',

  // Narrow viewports: full bleed
  'max-[575px]:mx-0 max-[575px]:w-full max-[575px]:max-w-full',
);

const dialogClassNameFullscreen =
  'min-[576px]:top-[91px] min-[576px]:h-[calc(100%-91px)] min-[576px]:max-h-[calc(100%-91px)]';

const frameClassName = classnames(
  'h-full w-full',

  // Closed: slide out
  '[translate:100%_0]',
  'transition-[translate] duration-300 ease-in-out',
  'motion-reduce:duration-[0.01ms]',

  // Open: slide in (`--global-drawer-open: none` skips)
  'group-open:[translate:0_0]',
  'group-open:[animation:var(--global-drawer-open,slide-in-from-right_300ms_ease-in-out_backwards)]',
  'starting:group-open:[translate:var(--global-drawer-open,100%_0)]',
  'motion-reduce:group-open:animate-none',
);

/**
 *
 * @param props - The component props
 * @param props.isOpen - Whether the drawer is open
 * @param props.onClose - Callback to close the drawer
 * @param props.children - Content to render inside the drawer
 * @param props.title - Optional title for the drawer (used for accessibility)
 * @param props.showCloseButton - Whether to show the close button (default: true)
 * @param props.'data-testid'
 */
export const GlobalMenuDrawer = ({
  isOpen,
  onClose,
  children,
  title,
  showCloseButton = true,
  'data-testid': dataTestId,
}: GlobalMenuDrawerProps) => {
  const t = useI18nContext();
  // TODO: @metamask/design-system-engineers remove isPureBlack once pure black is shipped targeted(13.43.0)
  const isPureBlack = usePureBlack();
  const environmentType = getEnvironmentType();
  const isFullscreen = environmentType === ENVIRONMENT_TYPE_FULLSCREEN;
  const isSidepanel = environmentType === ENVIRONMENT_TYPE_SIDEPANEL;
  // TODO: @metamask/design-system-engineers remove once pure black is shipped targeted(13.43.0)
  const isLargeDrawer = isFullscreen || isSidepanel;

  const dialogRef = useRef<HTMLDialogElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (isOpen) {
      if (!dialog.open) {
        if (typeof dialog.showModal === 'function') {
          dialog.showModal();
        } else {
          // jsdom does not implement HTMLDialogElement.showModal
          dialog.setAttribute('open', '');
        }
      }
      if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
      }
      return;
    }

    if (dialog.open) {
      if (typeof dialog.close === 'function') {
        dialog.close();
      } else {
        dialog.removeAttribute('open');
        dialog.dispatchEvent(new Event('close'));
      }
    }

    clearDrawerOpen();
  }, [isOpen]);

  const handleDialogClose = useCallback(() => {
    if (isOpen) {
      onClose();
    }
  }, [isOpen, onClose]);

  const requestClose = useCallback(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (typeof dialog.close === 'function') {
      dialog.close();
      return;
    }
    dialog.removeAttribute('open');
    dialog.dispatchEvent(new Event('close'));
  }, []);

  const titleId = 'global-menu-drawer-title';
  const dialogClassName = classnames(
    dialogClassNameBase,
    isFullscreen && dialogClassNameFullscreen,
  );

  const panel = (
    <Box
      className={`h-full min-h-0 flex flex-col overflow-hidden shadow-[var(--shadow-size-lg)_var(--color-shadow-default)]${isPureBlack && isLargeDrawer ? ' border-l border-muted' : ''}`}
      backgroundColor={
        isPureBlack && isLargeDrawer
          ? BoxBackgroundColor.BackgroundAlternative
          : BoxBackgroundColor.BackgroundDefault
      }
    >
      {showCloseButton && (
        <Box className="flex-shrink-0 flex flex-row items-center justify-start p-4 w-full overflow-hidden">
          <ButtonIcon
            iconName={IconName.ArrowLeft}
            size={ButtonIconSize.Md}
            ariaLabel={title || t('close')}
            onClick={requestClose}
            data-testid="drawer-close-button"
          />
          {title && (
            <span className="sr-only" id={titleId}>
              {title}
            </span>
          )}
        </Box>
      )}

      <Box
        ref={scrollRef}
        flexDirection={BoxFlexDirection.Column}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pb-6"
      >
        {children}
      </Box>
    </Box>
  );

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={title ? titleId : undefined}
      className={dialogClassName}
      // @ts-expect-error closedby missing in React types
      // eslint-disable-next-line react/no-unknown-property -- valid on <dialog>
      closedby="any"
      data-testid={dataTestId}
      onClose={handleDialogClose}
    >
      <div className={frameClassName}>{panel}</div>
    </dialog>
  );
};
