import React from 'react';
import { GlobalMenuList } from '../global-menu/global-menu-list';
import { useGlobalMenuSections } from './useGlobalMenuSections';
import { GlobalMenuDrawer } from './global-menu-drawer';
import type { GlobalMenuDrawerProps } from './global-menu-drawer.types';

export const GlobalMenuDrawerWithList = ({
  isOpen,
  onClose,
  ...drawerProps
}: Omit<GlobalMenuDrawerProps, 'children'>) => {
  const sections = useGlobalMenuSections(onClose);

  return (
    <GlobalMenuDrawer isOpen={isOpen} onClose={onClose} {...drawerProps}>
      <GlobalMenuList sections={sections} />
    </GlobalMenuDrawer>
  );
};
