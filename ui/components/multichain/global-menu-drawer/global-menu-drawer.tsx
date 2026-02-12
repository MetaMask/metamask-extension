import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Dialog, Transition } from '@headlessui/react';
import {
  Box,
  BoxBackgroundColor,
  BoxFlexDirection,
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_FULLSCREEN } from '../../../../shared/constants/app';
import type { GlobalMenuDrawerProps } from './global-menu-drawer.types';

/**
 * GlobalMenuDrawer component built on Headless UI v1 Dialog
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
  const isFullscreen = getEnvironmentType() === ENVIRONMENT_TYPE_FULLSCREEN;
  const [drawerStyle, setDrawerStyle] = useState<React.CSSProperties>({});
  const [backdropStyle, setBackdropStyle] = useState<React.CSSProperties>({});
  const [containerElement, setContainerElement] = useState<HTMLElement | null>(
    null,
  );
  const rootLayoutRef = useRef<HTMLElement | null>(null);
  const appContainerRef = useRef<HTMLElement | null>(null);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Handle fullscreen positioning
  useEffect(() => {
    if (!isFullscreen) {
      setContainerElement(null);
      setDrawerStyle({});
      setBackdropStyle({});
      return;
    }

    if (!isOpen) {
      return;
    }

    const findRootLayout = (): HTMLElement | null => {
      // Return cached element if available and still in DOM
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

      // Fallback: search in app container
      if (!found) {
        const appContainer = document.querySelector('.app') as HTMLElement;
        if (appContainer) {
          appContainerRef.current = appContainer;
          found =
            (Array.from(appContainer.children).find(
              (child) =>
                child instanceof HTMLElement &&
                child.className.includes('max-w-[') &&
                child.classList.contains('flex') &&
                child.classList.contains('flex-col'),
            ) as HTMLElement) || null;
        }
      }

      // Cache the found element
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

      // Cache app container if not already cached
      if (!appContainerRef.current) {
        appContainerRef.current = document.querySelector('.app') as HTMLElement;
      }

      const appContainer = appContainerRef.current;
      if (!appContainer) {
        // Fallback: if app container not found, don't render in fullscreen mode
        setContainerElement(null);
        return;
      }

      const LOGO_HEIGHT = 90;

      const rootLayoutRect = rootLayout.getBoundingClientRect();
      const appRect = appContainer.getBoundingClientRect();

      // Dialog container covers entire RootLayout area
      setDrawerStyle({
        position: 'absolute',
        top: `${rootLayoutRect.top - appRect.top}px`,
        left: `${rootLayoutRect.left - appRect.left}px`,
        width: `${rootLayoutRect.width}px`,
        height: `${rootLayoutRect.height}px`,
      });

      // Backdrop starts below the logo (90px from top) and fills the rest of the Dialog container
      setBackdropStyle({
        position: 'absolute',
        top: `${LOGO_HEIGHT}px`,
        left: 0,
        right: 0,
        bottom: 0,
      });

      setContainerElement(appContainer);
    };

    // Initial setup
    const frameId = requestAnimationFrame(updatePosition);

    // Debounce resize handler
    const handleResize = () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = setTimeout(() => {
        updatePosition();
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(frameId);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [isFullscreen, isOpen, anchorElement]);

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

  // In fullscreen, wait for container to be found
  if (isFullscreen && isOpen && !containerElement) {
    return null;
  }

  const dialogContent = (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog
        open={isOpen}
        onClose={
          onClickOutside
            ? onClose
            : () => {
                // No-op: onClickOutside is disabled
              }
        }
        className={`z-[1050] overflow-hidden ${
          isFullscreen ? 'absolute' : 'fixed inset-0'
        }`}
        data-testid={dataTestId}
        style={isFullscreen ? drawerStyle : undefined}
      >
        {/* Overlay backdrop */}
        {isFullscreen ? (
          <Transition.Child
            as={React.Fragment}
            enter="transition-opacity duration-250 ease-in-out"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity duration-250 ease-in-out"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div
              className="absolute inset-0 bg-[var(--color-overlay-default)] motion-reduce:transition-none"
              style={
                Object.keys(backdropStyle).length > 0
                  ? {
                      ...backdropStyle,
                      zIndex: 0,
                    }
                  : { position: 'absolute', inset: 0, zIndex: 0 }
              }
              aria-hidden="true"
              onClick={onClickOutside ? onClose : undefined}
            />
          </Transition.Child>
        ) : (
          <Transition.Child
            as={React.Fragment}
            enter="transition-opacity duration-250 ease-in-out"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity duration-250 ease-in-out"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Backdrop
              className="fixed inset-0 bg-[var(--color-overlay-default)] motion-reduce:transition-none"
              aria-hidden="true"
            />
          </Transition.Child>
        )}

        {/* Drawer panel */}
        <div
          className={`overflow-hidden pointer-events-none ${
            isFullscreen ? 'absolute inset-0' : 'fixed inset-0'
          }`}
          style={isFullscreen ? { zIndex: 1, top: '90px' } : undefined}
        >
          <div
            className={`flex ${
              isFullscreen
                ? 'absolute right-0 top-0 bottom-0'
                : 'absolute inset-y-0 right-0 pl-10'
            }`}
          >
            <Transition.Child
              as={React.Fragment}
              enter="transition-transform duration-250 ease-in-out"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transition-transform duration-250 ease-in-out"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <Dialog.Panel
                className="w-screen max-w-full pointer-events-auto motion-reduce:transition-none"
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
                        size={ButtonIconSize.Lg}
                        ariaLabel={title || t('close')}
                        onClick={onClose}
                        data-testid="drawer-close-button"
                      />
                      {title && (
                        <Dialog.Title className="sr-only">{title}</Dialog.Title>
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
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );

  // In fullscreen mode, render to the app container instead of body
  if (isFullscreen && containerElement) {
    return ReactDOM.createPortal(dialogContent, containerElement);
  }

  return dialogContent;
};
