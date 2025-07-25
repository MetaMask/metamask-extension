import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { hideModal } from '../../../store/actions';
import { ModalHeader, ModalBody, Box } from '../../component-library';
import { Tab, Tabs } from '../../ui/tabs';
import { getMultichainIsEvm } from '../../../selectors/multichain';
import { CustomNetworks } from './components/custom-networks';
import { DefaultNetworks } from './components/default-networks';

// Network tabs component
export const NetworkTabs = ({ initialTab }: { initialTab: string }) => {
  const isEvmNetworkSelected = useSelector(getMultichainIsEvm);
  const dispatch = useDispatch();
  const handleClose = useCallback(() => {
    dispatch(hideModal());
  }, [dispatch]);
  return (
    <Box>
      <ModalHeader
        onBack={handleClose}
        onClose={handleClose}
        closeButtonProps={{ 'data-testid': 'modal-header-close-button' }}
      >
        Networks
      </ModalHeader>
      <ModalBody style={{ padding: 0 }}>
        <Tabs
          style={{ padding: 0 }}
          defaultActiveTabKey={initialTab}
          onTabClick={() => {
            // Tab click handler - intentionally empty for now
          }}
          tabListProps={{
            className: 'network-manager__tab-list',
          }}
          tabContentProps={{
            className: 'network-manager__tab-content',
          }}
        >
          <Tab tabKey="networks" name="Default">
            <DefaultNetworks />
          </Tab>
          <Tab
            tabKey="custom-networks"
            name="Custom"
            disabled={!isEvmNetworkSelected}
          >
            <CustomNetworks />
          </Tab>
        </Tabs>
      </ModalBody>
    </Box>
  );
};
