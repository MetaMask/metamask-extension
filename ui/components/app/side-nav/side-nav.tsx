import React from 'react';
import { Box } from '@metamask/design-system-react';
import { useMainNavItems } from '../../../hooks/useMainNavItems';
import { SideNavAccounts } from './side-nav-accounts';
import { SideNavItem } from './side-nav-item';

// Persistent left navigation for the fullscreen design: the logo, the main
// navigation items and the accounts list.
export const SideNav = () => {
  const items = useMainNavItems();

  return (
    <div
      data-testid="side-nav"
      className="side-nav flex h-full min-h-0 w-[320px] shrink-0 flex-col bg-background-default border-r border-border-muted"
      // Keeps the side nav out of the root page transition, like the bottom nav bar.
      style={{ viewTransitionName: 'side-nav' }}
    >
      <Box padding={4}>
        <img alt="" className="size-7" src="./images/logo/metamask-fox.svg" />
      </Box>
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
    </div>
  );
};
