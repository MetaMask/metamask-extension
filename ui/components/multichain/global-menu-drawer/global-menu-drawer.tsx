import React, { useLayoutEffect, useRef, useState, useCallback } from 'react';
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

const sidepanelCompactMaxWidth = 490;

export const GlobalMenuDrawer = ({
  isOpen,
  onClose,
  children,
  title,
  showCloseButton = true,
  width = '400px',
  'data-testid': dataTestId,
}: GlobalMenuDrawerProps) => {
  const t = useI18nContext();
  // TODO: @metamask/design-system-engineers remove isPureBlack once pure black is shipped targeted(13.43.0)
  const isPureBlack = usePureBlack();
  const environmentType = getEnvironmentType();
  const isFullscreen = environmentType === ENVIRONMENT_TYPE_FULLSCREEN;
  const isSidepanel = environmentType === ENVIRONMENT_TYPE_SIDEPANEL;
  const showBackdrop = isFullscreen || isSidepanel;
  const [isCompactSidepanelDrawer, setIsCompactSidepanelDrawer] =
    useState(false);
  // TODO: @metamask/design-system-engineers remove once pure black is shipped targeted(13.43.0)
  const isLargeDrawer =
    isFullscreen || (isSidepanel && !isCompactSidepanelDrawer);

  const dialogRef = useRef<HTMLDialogElement>(null);
  // Skip enter when mounted already open (e.g. back with ?drawerOpen=true)
  const [skipEnterAnimation, setSkipEnterAnimation] = useState(isOpen);

  useLayoutEffect(() => {
    if (!isSidepanel || typeof window.matchMedia !== 'function') {
      setIsCompactSidepanelDrawer(false);
      return;
    }

    const mediaQuery = window.matchMedia(
      `(max-width: ${sidepanelCompactMaxWidth}px)`,
    );
    const updateCompact = () => {
      setIsCompactSidepanelDrawer(mediaQuery.matches);
    };
    updateCompact();
    mediaQuery.addEventListener('change', updateCompact);
    return () => {
      mediaQuery.removeEventListener('change', updateCompact);
    };
  }, [isSidepanel]);

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
      // Sidepanel/popup: drop instant after enter so exit uses full duration.
      // Fullscreen: keep until close — it only disables enter keyframes.
      if (skipEnterAnimation && !isFullscreen) {
        setSkipEnterAnimation(false);
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
    // After close() so fullscreen doesn't briefly re-apply enter keyframes
    setSkipEnterAnimation(false);
  }, [isOpen, skipEnterAnimation, isFullscreen]);

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
  const className = [
    'global-menu-drawer',
    showBackdrop ? 'global-menu-drawer--backdrop' : '',
    isFullscreen ? 'global-menu-drawer--fullscreen' : '',
    skipEnterAnimation ? 'global-menu-drawer--instant' : '',
  ]
    .filter(Boolean)
    .join(' ');

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
      // eslint-disable-next-line react/no-unknown-property -- valid on <dialog>
      // @ts-expect-error closedby missing in React types
      closedby="any"
      data-testid={dataTestId}
      onClose={handleDialogClose}
      style={{ '--drawer-width': width } as React.CSSProperties}
    >
      {isFullscreen ? (
        <div className="global-menu-drawer__frame">{panel}</div>
      ) : (
        panel
      )}
    </dialog>
  );
};
