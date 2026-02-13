import React, { useEffect, useLayoutEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
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

const DRAWER_TRANSITION_MS = 300;

type DrawerPhase = 'entering' | 'open' | 'exiting';

/**
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
  const [drawerPhase, setDrawerPhase] = useState<DrawerPhase | null>(null);
  const exitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enterFrameRef = useRef<number | null>(null);
  const wasOpenRef = useRef(false);
  const rootLayoutRef = useRef<HTMLElement | null>(null);
  const appContainerRef = useRef<HTMLElement | null>(null);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const usePortal = isFullscreen || isSidepanel;
  const hasPosition = Object.keys(drawerStyle).length > 0;
  const readyToShow = isOpen && (!usePortal || hasPosition);

  // Custom transition: only start when we can show (have position in portal mode).
  useEffect(() => {
    if (readyToShow) {
      wasOpenRef.current = true;
      if (exitTimeoutRef.current !== null) {
        clearTimeout(exitTimeoutRef.current);
        exitTimeoutRef.current = null;
      }
      setDrawerPhase('entering');
      enterFrameRef.current = requestAnimationFrame(() => {
        enterFrameRef.current = requestAnimationFrame(() => {
          enterFrameRef.current = null;
          setDrawerPhase('open');
        });
      });
      return () => {
        if (enterFrameRef.current !== null) {
          cancelAnimationFrame(enterFrameRef.current);
          enterFrameRef.current = null;
        }
      };
    }
    if (wasOpenRef.current && !isOpen) {
      wasOpenRef.current = false;
      setDrawerPhase('exiting');
      exitTimeoutRef.current = setTimeout(() => {
        exitTimeoutRef.current = null;
        setDrawerPhase(null);
      }, DRAWER_TRANSITION_MS);
      return () => {
        if (exitTimeoutRef.current !== null) {
          clearTimeout(exitTimeoutRef.current);
          exitTimeoutRef.current = null;
        }
      };
    }
    return undefined;
  }, [isOpen, readyToShow]);

  const isDrawerMounted = drawerPhase !== null;
  const isExiting = drawerPhase === 'exiting';
  const isEntering = drawerPhase === 'entering';
  const isDrawerOpen = drawerPhase === 'open';

  useLayoutEffect(() => {
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
  }, [usePortal, isFullscreen, isOpen, anchorElement]);

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
  // Popup: no portal, fixed overlay. Fullscreen/sidepanel: portal into .app and overlay root layout.
  const portalTarget =
    containerElement ||
    (usePortal && isOpen && typeof document !== 'undefined'
      ? (document.querySelector('.app') as HTMLElement)
      : null);

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

  const backdropOpacity = isDrawerOpen ? 1 : 0;
  const panelTransform =
    isEntering || isExiting ? 'translateX(100%)' : 'translateX(0)';

  const dialogContent = isDrawerMounted ? (
    <div
      aria-labelledby={title ? titleId : undefined}
      aria-modal="true"
      className={`z-[1050] overflow-hidden ${dialogPositionClass}`}
      data-testid={dataTestId}
      role="dialog"
      style={dialogPositionStyle}
    >
      <div
        className="absolute inset-0 bg-[var(--color-overlay-default)] motion-reduce:transition-none transition-opacity ease-linear"
        style={{
          ...(isFullscreen && Object.keys(backdropStyle).length > 0
            ? { ...backdropStyle, zIndex: 0 }
            : { zIndex: 0 }),
          opacity: backdropOpacity,
          transitionDuration: `${DRAWER_TRANSITION_MS}ms`,
        }}
        aria-hidden="true"
        onClick={onClickOutside ? onClose : undefined}
      />

      {/* Drawer panel */}
      <div
        className={
          isFullscreen
            ? 'overflow-hidden pointer-events-none absolute right-0 top-0 bottom-0 flex h-full transition-[transform] ease-in-out motion-reduce:transition-none'
            : 'overflow-hidden pointer-events-none absolute inset-y-0 right-0 flex pl-10 h-full transition-[transform] ease-in-out motion-reduce:transition-none'
        }
        style={{
          ...(contentTopOffset
            ? { zIndex: 1, top: `${contentTopOffset}px` }
            : { zIndex: 1 }),
          transform: panelTransform,
          transitionDuration: `${DRAWER_TRANSITION_MS}ms`,
        }}
      >
        <div
          className="w-screen max-w-full pointer-events-auto h-full"
          style={{ maxWidth: width }}
        >
          <Box
            className="h-full flex flex-col overflow-hidden bg-[var(--color-background-default)] shadow-[var(--shadow-size-lg)_var(--color-shadow-default)]"
            backgroundColor={BoxBackgroundColor.BackgroundDefault}
          >
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

            <Box
              flexDirection={BoxFlexDirection.Column}
              className="flex-1 overflow-y-auto overflow-x-hidden"
            >
              {children}
            </Box>
          </Box>
        </div>
      </div>
    </div>
  ) : null;

  // Portal only in fullscreen/sidepanel (popup uses fixed positioning, no portal)
  if (portalTarget) {
    return ReactDOM.createPortal(dialogContent, portalTarget);
  }

  return dialogContent;
};
