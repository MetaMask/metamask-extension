import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  ButtonIcon,
  IconName,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_FULLSCREEN } from '../../../../shared/constants/app';
import type { GlobalMenuDrawerProps } from './global-menu-drawer.types';

/**
 * GlobalMenuDrawer component
 *
 * A full-height drawer that slides in from the right side of the extension UI.
 * The drawer is 400px wide and covers the entire extension UI height.
 * If the viewport is wider than 400px, the content stays constrained to 400px.
 *
 * @param props - The component props
 * @param props.isOpen - Whether the drawer is open
 * @param props.closeMenu - Callback to close the drawer
 * @param props.anchorElement - Anchor element (hamburger button) to help find the correct container
 * @param props.children
 */
export const GlobalMenuDrawer = ({
  isOpen,
  closeMenu,
  anchorElement,
  children,
}: GlobalMenuDrawerProps) => {
  const t = useI18nContext();
  const isFullscreen = getEnvironmentType() === ENVIRONMENT_TYPE_FULLSCREEN;
  const [containerElement, setContainerElement] = useState<HTMLElement | null>(
    null,
  );
  const [drawerStyle, setDrawerStyle] = useState<React.CSSProperties>({});

  // Cache rootLayout element to avoid repeated DOM traversal
  const rootLayoutRef = React.useRef<HTMLElement | null>(null);
  const appContainerRef = React.useRef<HTMLElement | null>(null);

  // Find RootLayout and calculate positioning in fullscreen
  useEffect(() => {
    if (!isFullscreen) {
      setContainerElement(document.body);
      setDrawerStyle({});
      rootLayoutRef.current = null;
      appContainerRef.current = null;
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
        return;
      }

      const LOGO_HEIGHT = 90;

      // Position drawer below logo, constrained to RootLayout bounds
      const rootLayoutRect = rootLayout.getBoundingClientRect();
      const appRect = appContainer.getBoundingClientRect();
      setDrawerStyle({
        position: 'absolute',
        top: `${LOGO_HEIGHT}px`,
        left: `${rootLayoutRect.left - appRect.left}px`,
        width: `${rootLayoutRect.width}px`,
        bottom: 0,
        height: 'auto',
      });

      setContainerElement(appContainer);
    };

    const frameId = requestAnimationFrame(updatePosition);

    // Debounce resize handler to avoid excessive calls
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        updatePosition();
      }, 100); // 100ms debounce
    };

    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
    };
  }, [isFullscreen, anchorElement]);

  // Handle ESC key press to close drawer
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        closeMenu();
      }
    };

    document.addEventListener('keydown', handleEscKey, { capture: true });

    return () => {
      document.removeEventListener('keydown', handleEscKey, { capture: true });
    };
  }, [isOpen, closeMenu]);

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

  const drawerContent = (
    <Box
      className={`fixed top-0 right-0 w-full h-full z-[1050] ${
        isOpen ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
      style={isFullscreen ? drawerStyle : undefined}
      data-testid="global-menu-drawer"
    >
      {/* Overlay backdrop */}
      <Box
        className={`absolute inset-0 transition-opacity duration-[250ms] ease-in-out ${
          isOpen ? 'opacity-100' : 'opacity-0'
        } motion-reduce:transition-none`}
        style={{
          backgroundColor: 'var(--color-overlay-default)',
        }}
        onClick={closeMenu}
        data-testid="global-menu-drawer-overlay"
      />
      {/* Drawer content */}
      <Box
        className={`absolute top-0 right-0 w-[400px] max-w-full h-full flex flex-col overflow-hidden transition-transform duration-[250ms] ease-in-out motion-reduce:transition-none ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        backgroundColor={BoxBackgroundColor.BackgroundDefault}
        style={{
          boxShadow: 'var(--shadow-size-lg) var(--color-shadow-default)',
        }}
      >
        <Box
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.Stretch}
          backgroundColor={BoxBackgroundColor.BackgroundDefault}
          className="w-full max-w-[400px] h-full overflow-y-auto overflow-x-hidden flex flex-col"
        >
          {/* Header with close button */}
          <Box className="flex flex-row items-center justify-start p-4 w-full overflow-hidden">
            <ButtonIcon
              iconName={IconName.ArrowLeft}
              ariaLabel={t('close')}
              onClick={closeMenu}
              data-testid="global-menu-drawer-close-button"
            />
          </Box>
          {children}
        </Box>
      </Box>
    </Box>
  );

  if (!isOpen) {
    return null;
  }

  // In fullscreen, wait for container to be found
  if (isFullscreen && !containerElement) {
    return null;
  }

  const portalTarget = containerElement || document.body;
  return createPortal(drawerContent, portalTarget);
};
