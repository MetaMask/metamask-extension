import React from 'react';
import { useMainNavItems } from '../../../hooks/useMainNavItems';
import { ResizeBar } from '../../ui/resize-bar/resize-bar';
import { SideNavAccounts } from './side-nav-accounts';
import { SideNavItem } from './side-nav-item';

const sideNavWidthVariable = '--side-nav-width';
const sideNavDefaultWidth = 360;

// Persistent left navigation for the fullscreen design: the logo, the main
// navigation items and the accounts list.
export const SideNav = () => {
  const items = useMainNavItems();

  return (
    <div
      data-testid="parent-selector-main-nav"
      className="side-nav relative flex h-full min-h-0 w-[var(--side-nav-width)] min-w-[240px] max-w-[480px] shrink-0 flex-col bg-background-default border-r border-border-muted"
      // Keeps the side nav out of the root page transition, like the bottom nav bar.
      style={
        {
          [sideNavWidthVariable]: `${sideNavDefaultWidth}px`,
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
        property={sideNavWidthVariable}
        value={sideNavDefaultWidth}
        min={240}
        max={480}
      />
    </div>
  );
};
