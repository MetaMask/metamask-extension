import React from 'react';
import { useMainNavItems } from '../../../hooks/useMainNavItems';
import { MultichainMetaFoxLogo } from '../../multichain/app-header/multichain-meta-fox-logo';
import { SideNavAccounts } from './side-nav-accounts';
import { SideNavItem } from './side-nav-item';

/**
 * Persistent left navigation for the fullscreen design: the logo, the main
 * navigation items and the accounts list.
 */
export const SideNav = () => {
  const items = useMainNavItems();

  return (
    <aside
      data-testid="side-nav"
      className="side-nav flex h-full min-h-0 w-[260px] shrink-0 flex-col bg-background-default border-r border-[color:var(--bar-border-color)]"
      // Keeps the side nav out of the root page transition, like the bottom nav bar.
      style={{ viewTransitionName: 'side-nav' }}
    >
      <div className="px-4">
        <MultichainMetaFoxLogo />
      </div>
      <nav className="flex shrink-0 flex-col gap-1 px-2 pb-2">
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
    </aside>
  );
};
