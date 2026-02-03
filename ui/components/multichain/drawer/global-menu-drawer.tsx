import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import classnames from 'classnames';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  ButtonIcon,
  IconName,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { ENVIRONMENT_TYPE_FULLSCREEN } from '../../../../shared/constants/app';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import type { GlobalMenuDrawerProps } from './global-menu-drawer.types';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths

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

  // Find RootLayout and calculate positioning in fullscreen
  useEffect(() => {
    if (!isFullscreen) {
      setContainerElement(document.body);
      setDrawerStyle({});
      return;
    }

    const findRootLayout = (): HTMLElement | null => {
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
            return parent;
          }
          current = parent;
        }
      }

      const appContainer = document.querySelector('.app') as HTMLElement;
      if (!appContainer) {
        return null;
      }

      return (
        (Array.from(appContainer.children).find(
          (child) =>
            child instanceof HTMLElement &&
            child.className.includes('max-w-[') &&
            child.classList.contains('flex') &&
            child.classList.contains('flex-col'),
        ) as HTMLElement) || null
      );
    };

    const updatePosition = () => {
      const rootLayout = findRootLayout();
      if (!rootLayout) {
        return;
      }

      const appContainer = document.querySelector('.app') as HTMLElement;
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
    window.addEventListener('resize', updatePosition);
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', updatePosition);
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
      className={classnames('global-menu-drawer', {
        'global-menu-drawer--open': isOpen,
        'global-menu-drawer--fullscreen': isFullscreen,
      })}
      style={isFullscreen ? drawerStyle : undefined}
      data-testid="global-menu-drawer"
    >
      {/* Overlay backdrop */}
      <Box
        className="global-menu-drawer__overlay"
        onClick={closeMenu}
        data-testid="global-menu-drawer-overlay"
      />
      {/* Drawer content */}
      <Box className="global-menu-drawer__content">
        <Box
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.Stretch}
          backgroundColor={BoxBackgroundColor.BackgroundDefault}
          className="global-menu-drawer__inner"
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
