import React, { useEffect, useLayoutEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Transition } from '@headlessui/react';
import {
  Box,
  BoxBackgroundColor,
  BoxFlexDirection,
  ButtonIcon,
  ButtonIconSize,
  IconColor,
  IconName,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import {
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_SIDEPANEL,
} from '../../../../shared/constants/app';
import type { GlobalMenuDrawerProps } from './global-menu-drawer.types';

/**
 * GlobalMenuDrawer built on Headless UI Transition (div shell so leave transition runs in popup)
 *
 * @param props - The component props
 * @param props.isOpen - Whether the drawer is open
 * @param props.onClose - Callback to close the drawer
 * @param props.children - Content to render inside the drawer
 * @param props.title - Optional title for the drawer (used for accessibility)
 * @param props.showCloseButton - Whether to show the close button (default: true)
 * @param props.width - Width of the drawer (default: '400px')
 * @param props.onClickOutside - Whether clicking outside closes the drawer (default: true)
 * @param props.'data-testid'
 * @param props.anchorElement
 */
export const GlobalMenuDrawer = ({
  isOpen,
  onClose,
  children,
  title,
  showCloseButton = true,
  width = '400px',
  onClickOutside = true,
  'data-testid': dataTestId,
  anchorElement,
}: GlobalMenuDrawerProps) => {
  const t = useI18nContext();
  const environmentType = getEnvironmentType();
  const isFullscreen = environmentType === ENVIRONMENT_TYPE_FULLSCREEN;
  const isSidepanel = environmentType === ENVIRONMENT_TYPE_SIDEPANEL;
  const [drawerStyle, setDrawerStyle] = useState<React.CSSProperties>({});
  const [backdropStyle, setBackdropStyle] = useState<React.CSSProperties>({});
  const [containerElement, setContainerElement] = useState<HTMLElement | null>(
    null,
  );
  const [contentTopOffset, setContentTopOffset] = useState(0);
  const [readyToReveal, setReadyToReveal] = useState(false);
  const revealFrameRef = useRef<number | null>(null);
  const cancelRevealRef = useRef(false);
  const rootLayoutRef = useRef<HTMLElement | null>(null);
  const appContainerRef = useRef<HTMLElement | null>(null);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Fullscreen and sidepanel: portal into .app and position over root layout (same pattern)
  // useLayoutEffect + sync updatePosition so we have position before paint (avoids flicker)
  useLayoutEffect(() => {
    const usePortal = isFullscreen || (isSidepanel && Boolean(anchorElement));
    if (!usePortal) {
      setContainerElement(null);
      setDrawerStyle({});
      setBackdropStyle({});
      setContentTopOffset(0);
      return;
    }

    const appContainer =
      appContainerRef.current ||
      (document.querySelector('.app') as HTMLElement);
    if (appContainer) {
      appContainerRef.current = appContainer;
    }

    if (!appContainer) {
      setContainerElement(null);
      return;
    }

    // Same root layout for both: walk up from anchor or find in .app (the content container)
    const findRootLayout = (): HTMLElement | null => {
      if (
        rootLayoutRef.current &&
        document.body.contains(rootLayoutRef.current)
      ) {
        return rootLayoutRef.current;
      }
      let found: HTMLElement | null = null;
      if (anchorElement) {
        let current: HTMLElement | null = anchorElement;
        while (current && current !== document.body) {
          const parent: HTMLElement | null = current.parentElement;
          if (
            parent instanceof HTMLElement &&
            parent.className.includes('max-w-[') &&
            parent.classList.contains('flex') &&
            parent.classList.contains('flex-col')
          ) {
            found = parent;
            break;
          }
          current = parent;
        }
      }
      if (!found) {
        found =
          (Array.from(appContainer.children).find(
            (child) =>
              child instanceof HTMLElement &&
              child.className.includes('max-w-[') &&
              child.classList.contains('flex') &&
              child.classList.contains('flex-col'),
          ) as HTMLElement) || null;
      }
      if (found) {
        rootLayoutRef.current = found;
      }
      return found;
    };

    const updatePosition = () => {
      const rootLayout = findRootLayout();
      if (!rootLayout) {
        return;
      }

      const rootLayoutRect = rootLayout.getBoundingClientRect();
      const appR = appContainer.getBoundingClientRect();

      // Dialog covers root layout in both fullscreen and sidepanel
      setDrawerStyle({
        position: 'absolute',
        top: `${rootLayoutRect.top - appR.top}px`,
        left: `${rootLayoutRect.left - appR.left}px`,
        width: `${rootLayoutRect.width}px`,
        height: `${rootLayoutRect.height}px`,
      });

      // Fullscreen: 90px logo above content; sidepanel: no logo, overlay fills container
      const logoHeight = isFullscreen ? 90 : 0;
      if (logoHeight > 0) {
        setBackdropStyle({
          position: 'absolute',
          top: `${logoHeight}px`,
          left: 0,
          right: 0,
          bottom: 0,
        });
        setContentTopOffset(logoHeight);
      } else {
        setBackdropStyle({});
        setContentTopOffset(0);
      }

      setContainerElement(appContainer);
    };

    if (isOpen) {
      updatePosition();
    }

    const handleResize = () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = setTimeout(updatePosition, 100);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [isFullscreen, isSidepanel, isOpen, anchorElement]);

  // Prevent body scroll when drawer is open (only for non-fullscreen)
  useEffect(() => {
    if (!isFullscreen) {
      if (isOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }

      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, isFullscreen]);

  // Escape key closes drawer (Dialog would unmount on close and block leave transition in popup)
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const titleId = 'global-menu-drawer-title';
  const hasPosition = Object.keys(drawerStyle).length > 0;
  useEffect(() => {
    if (!isOpen) {
      cancelRevealRef.current = true;
      setReadyToReveal(false);
      if (revealFrameRef.current !== null) {
        cancelAnimationFrame(revealFrameRef.current);
        revealFrameRef.current = null;
      }
      return;
    }
    if (!hasPosition) {
      return;
    }
    cancelRevealRef.current = false;
    revealFrameRef.current = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        revealFrameRef.current = null;
        if (!cancelRevealRef.current) {
          setReadyToReveal(true);
        }
      });
    });
    return () => {
      cancelRevealRef.current = true;
      if (revealFrameRef.current !== null) {
        cancelAnimationFrame(revealFrameRef.current);
        revealFrameRef.current = null;
      }
    };
  }, [isOpen, hasPosition]);

  const usePortal = isFullscreen || (isSidepanel && Boolean(anchorElement));
  // Avoid null frame: when open in portal mode use .app as fallback target so we can render hidden until position is ready
  const portalTarget =
    containerElement ||
    (usePortal && isOpen && typeof document !== 'undefined'
      ? (document.querySelector('.app') as HTMLElement)
      : null);

  const hideUntilPositioned =
    usePortal && isOpen && (!hasPosition || !readyToReveal);

  // Dialog: fixed inset-0 for popup; absolute + drawerStyle when portaled
  const dialogPositionClass = portalTarget ? 'absolute' : 'fixed inset-0';
  let dialogPositionStyle: React.CSSProperties | undefined;
  if (portalTarget && hasPosition) {
    dialogPositionStyle = drawerStyle;
  } else if (portalTarget) {
    dialogPositionStyle = {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    };
  } else {
    dialogPositionStyle = undefined;
  }

  const dialogContent = (
    <Transition show={isOpen} appear>
      <div
        aria-labelledby={title ? titleId : undefined}
        aria-modal="true"
        className={`z-[1050] overflow-hidden ${dialogPositionClass}`}
        data-testid={dataTestId}
        role="dialog"
        style={{
          ...dialogPositionStyle,
          ...(hideUntilPositioned
            ? { visibility: 'hidden' as const, pointerEvents: 'none' as const }
            : {}),
        }}
      >
        <Transition.Child
          enter="transition-opacity duration-300 ease-linear"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity duration-300 ease-linear"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            className="absolute inset-0 bg-[var(--color-overlay-default)] motion-reduce:transition-none"
            style={
              isFullscreen && Object.keys(backdropStyle).length > 0
                ? { ...backdropStyle, zIndex: 0 }
                : { zIndex: 0 }
            }
            aria-hidden="true"
            onClick={onClickOutside ? onClose : undefined}
          />
        </Transition.Child>

        {/* Drawer panel - fullscreen offsets below logo via contentTopOffset */}
        <Transition.Child
          as="div"
          className={
            isFullscreen
              ? 'overflow-hidden pointer-events-none absolute right-0 top-0 bottom-0 flex h-full'
              : 'overflow-hidden pointer-events-none absolute inset-y-0 right-0 flex pl-10 h-full'
          }
          style={
            contentTopOffset
              ? { zIndex: 1, top: `${contentTopOffset}px` }
              : { zIndex: 1 }
          }
          enter="transition ease-in-out duration-300 transform"
          enterFrom="translate-x-full"
          enterTo="translate-x-0"
          leave="transition ease-in-out duration-300 transform"
          leaveFrom="translate-x-0"
          leaveTo="translate-x-full"
        >
          <div
            className="w-screen max-w-full pointer-events-auto motion-reduce:transition-none h-full"
            style={{ maxWidth: width }}
          >
            <Box
              className="h-full flex flex-col overflow-hidden bg-[var(--color-background-default)] shadow-[var(--shadow-size-lg)_var(--color-shadow-default)]"
              backgroundColor={BoxBackgroundColor.BackgroundDefault}
            >
              {/* Header with close button */}
              {showCloseButton && (
                <Box className="flex flex-row items-center justify-start p-4 w-full overflow-hidden">
                  <ButtonIcon
                    iconName={IconName.ArrowLeft}
                    size={ButtonIconSize.Sm}
                    ariaLabel={title || t('close')}
                    onClick={onClose}
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

              {/* Drawer content */}
              <Box
                flexDirection={BoxFlexDirection.Column}
                className="flex-1 overflow-y-auto overflow-x-hidden"
              >
                {children}
              </Box>
            </Box>
          </div>
        </Transition.Child>
      </div>
    </Transition>
  );

  // Portal into app container for both fullscreen and sidepanel
  if (portalTarget) {
    return ReactDOM.createPortal(dialogContent, portalTarget);
  }

  return dialogContent;
};
