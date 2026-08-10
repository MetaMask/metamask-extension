import React, { useLayoutEffect, useRef, useCallback } from 'react';
import classnames from 'clsx';
import {
  Box,
  BoxBackgroundColor,
  BoxFlexDirection,
  ButtonIcon,
  ButtonIconSize,
  IconColor,
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
  const className = classnames('global-menu-drawer', {
    'global-menu-drawer--fullscreen': isFullscreen,
  });

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
            className="text-icon-alternative"
            iconProps={{ color: IconColor.IconAlternative }}
          />
          {title && (
            <span className="sr-only" id={titleId}>
              {title}
            </span>
          )}
        </Box>
      )}

      <Box
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
      className={className}
      // @ts-expect-error closedby missing in React types
      // eslint-disable-next-line react/no-unknown-property -- valid on <dialog>
      closedby="any"
      data-testid={dataTestId}
      onClose={handleDialogClose}
    >
      <div className="global-menu-drawer__frame">{panel}</div>
    </dialog>
  );
};
