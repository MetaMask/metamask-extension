import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { hideModal } from '../../../store/actions';
import { ModalHeader } from '../../component-library';
import { Tab, Tabs } from '../../ui/tabs';
import { CustomNetworks } from './components/custom-networks';
import { DefaultNetworks } from './components/default-networks';

// Network tabs component
export const NetworkTabs = ({ initialTab }: { initialTab: string }) => {
  const dispatch = useDispatch();
  const handleClose = useCallback(() => {
    dispatch(hideModal());
  }, [dispatch]);
  return (
    <>
      <ModalHeader onBack={handleClose} onClose={handleClose}>
        Networks
      </ModalHeader>
      <Tabs
        defaultActiveTabKey={initialTab}
        onTabClick={() => {
          // Tab click handler - intentionally empty for now
        }}
        tabListProps={{
          className: 'network-manager__tab-list',
        }}
        padding={4}
      >
        <Tab tabKey="networks" name="Default">
          <DefaultNetworks />
        </Tab>
        <Tab tabKey="custom-networks" name="Custom">
          <CustomNetworks />
        </Tab>
      </Tabs>
    </>
  );
};