import React, { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { hideModal } from '../../../store/actions';
import { ModalHeader, ModalBody, Box } from '../../component-library';
import { Tab, Tabs } from '../../ui/tabs';
import { t } from '../../../../shared/lib/translate';
import { CustomNetworks } from './components/custom-networks';
import { DefaultNetworks } from './components/default-networks';

// Network tabs component
export const NetworkTabs = ({ initialTab }: { initialTab: string }) => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState(initialTab);
  const handleClose = useCallback(() => {
    dispatch(hideModal());
  }, [dispatch]);
  return (
    <Box>
      <ModalHeader
        onClose={handleClose}
        closeButtonProps={{ 'data-testid': 'modal-header-close-button' }}
      >
        {t('bridgeSelectNetwork') ?? 'Select network'}
      </ModalHeader>
      <ModalBody style={{ padding: 0 }}>
        <Tabs
          style={{ padding: 0 }}
          activeTab={activeTab}
          onTabClick={setActiveTab}
          tabListProps={{
            className: 'network-manager__tab-list px-4',
          }}
          tabContentProps={{
            className: 'network-manager__tab-content',
          }}
        >
          <Tab
            tabKey="networks"
            name={t('networkTabPopular') ?? 'Popular'}
            className="flex-1"
          >
            <DefaultNetworks />
          </Tab>
          <Tab
            tabKey="custom-networks"
            name={t('networkTabCustom') ?? 'Custom'}
            className="flex-1"
          >
            <CustomNetworks />
          </Tab>
        </Tabs>
      </ModalBody>
    </Box>
  );
};
