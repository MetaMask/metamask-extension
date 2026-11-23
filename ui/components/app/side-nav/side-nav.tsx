import React from 'react';
import { useMainNavItems } from '../../../hooks/useMainNavItems';
import { ResizeBar } from '../../ui/resize-bar/resize-bar';
import { SideNavAccounts } from './side-nav-accounts';
import { SideNavItem } from './side-nav-item';

const widthCssVar = '--side-nav-width';
const widthStorageKey = 'metamask-side-nav-width';
const defaultWidth = 360;
const minWidth = 240;
const maxWidth = 480;

function clampSideNavWidth(width: number) {
  return Math.min(maxWidth, Math.max(minWidth, width));
}

function readSideNavWidth() {
  const parsed = Number.parseInt(
    localStorage.getItem(widthStorageKey) ?? '',
    10,
  );
  if (!Number.isFinite(parsed)) {
    return defaultWidth;
  }

  return clampSideNavWidth(parsed);
}

function writeSideNavWidth(width: number) {
  localStorage.setItem(widthStorageKey, String(clampSideNavWidth(width)));
}

// Persistent left navigation for the fullscreen design: the logo, the main
// navigation items and the accounts list.
export const SideNav = () => {
  const items = useMainNavItems();
  const width = readSideNavWidth();

  return (
    <div
      data-testid="parent-selector-main-nav"
      className={`side-nav relative flex h-full min-h-0 w-[var(--side-nav-width)] min-w-[${minWidth}px] max-w-[${maxWidth}px] shrink-0 flex-col bg-background-default border-r border-border-muted`}
      // Keeps the side nav out of the root page transition, like the bottom nav bar.
      style={
        {
          [widthCssVar]: `${width}px`,
          viewTransitionName: 'side-nav',
        } as React.CSSProperties
      }
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
            data-testid={`main-nav-${id}`}
          />
        ))}
      </nav>
      <SideNavAccounts />
      <ResizeBar
        property={widthCssVar}
        value={width}
        min={minWidth}
        max={maxWidth}
        onResize={writeSideNavWidth}
      />
    </div>
  );
};
