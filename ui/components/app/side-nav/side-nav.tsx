import React from 'react';
import { useMainNavItems } from '../../../hooks/useMainNavItems';
import { SideNavAccounts } from './side-nav-accounts';
import { SideNavItem } from './side-nav-item';

const SIDE_NAV_MIN_WIDTH_PX = 240;
const SIDE_NAV_DEFAULT_WIDTH_PX = 320;
const SIDE_NAV_MAX_WIDTH_PX = 480;
const SIDE_NAV_RESIZE_STEP_PX = 16;

const clampSideNavWidth = (width: number) =>
  Math.min(
    SIDE_NAV_MAX_WIDTH_PX,
    Math.max(SIDE_NAV_MIN_WIDTH_PX, Math.round(width)),
  );

const setSideNavWidth = (sideNav: HTMLDivElement, width: number) => {
  const nextWidth = clampSideNavWidth(width);
  sideNav.style.setProperty('--side-nav-width', `${nextWidth}px`);
  return nextWidth;
};

// Persistent left navigation for the fullscreen design: the logo, the main
// navigation items and the accounts list.
export const SideNav = () => {
  const items = useMainNavItems();

  const resize = (event: React.PointerEvent<HTMLDivElement>) => {
    const sideNav = event.currentTarget.parentElement;
    if (!sideNav) {
      return;
    }

    const width = setSideNavWidth(
      sideNav,
      event.clientX - sideNav.getBoundingClientRect().left,
    );
    event.currentTarget.setAttribute('aria-valuenow', String(width));
  };

  const resizeByKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const sideNav = event.currentTarget.parentElement;
    if (!sideNav) {
      return;
    }

    const currentWidth =
      Number.parseInt(
        sideNav.style.getPropertyValue('--side-nav-width'),
        10,
      ) || SIDE_NAV_DEFAULT_WIDTH_PX;

    const widthsByKey: Record<string, number> = {
      ArrowLeft: currentWidth - SIDE_NAV_RESIZE_STEP_PX,
      ArrowRight: currentWidth + SIDE_NAV_RESIZE_STEP_PX,
      Home: SIDE_NAV_MIN_WIDTH_PX,
      End: SIDE_NAV_MAX_WIDTH_PX,
    };
    const nextWidth = widthsByKey[event.key];

    if (nextWidth === undefined) {
      return;
    }

    event.preventDefault();
    const width = setSideNavWidth(sideNav, nextWidth);
    event.currentTarget.setAttribute('aria-valuenow', String(width));
  };

  return (
    <div
      data-testid="side-nav"
      className="side-nav relative flex h-full min-h-0 w-[var(--side-nav-width)] min-w-[240px] max-w-[480px] shrink-0 flex-col border-r border-border-muted bg-background-default"
      // Keeps the side nav out of the root page transition, like the bottom nav bar.
      style={{
        '--side-nav-width': `${SIDE_NAV_DEFAULT_WIDTH_PX}px`,
        viewTransitionName: 'side-nav',
      } as React.CSSProperties}
    >
      <img alt="" className="m-4 size-7" src="./images/logo/metamask-fox.svg" />
      <nav className="flex shrink-0 flex-col gap-1 pb-2">
        {items.map(({ id, icon, label, isActive, onClick }) => (
          <SideNavItem
            key={id}
            isActive={isActive}
            icon={icon}
            label={label}
            onClick={onClick}
            data-testid={`side-nav-${id}`}
          />
        ))}
      </nav>
      <SideNavAccounts />
      <div
        role="separator"
        aria-label="Resize sidebar"
        aria-orientation="vertical"
        aria-valuemin={SIDE_NAV_MIN_WIDTH_PX}
        aria-valuemax={SIDE_NAV_MAX_WIDTH_PX}
        aria-valuenow={SIDE_NAV_DEFAULT_WIDTH_PX}
        tabIndex={0}
        className="absolute -right-1 top-0 z-10 h-full w-2 cursor-col-resize touch-none focus-visible:outline-none before:absolute before:inset-y-0 before:left-[3px] before:w-px before:bg-border-muted hover:before:bg-primary-default focus-visible:before:bg-primary-default"
        data-testid="side-nav-resize-handle"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture?.(event.pointerId);
        }}
        onPointerMove={resize}
        onPointerUp={(event) => {
          event.currentTarget.releasePointerCapture?.(event.pointerId);
        }}
        onPointerCancel={(event) => {
          event.currentTarget.releasePointerCapture?.(event.pointerId);
        }}
        onKeyDown={resizeByKey}
      />
    </div>
  );
};
