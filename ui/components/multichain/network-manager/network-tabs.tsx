import React, { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { hideModal } from '../../../store/actions';
import { ModalHeader, ModalBody, Box } from '../../component-library';
import { Tab, Tabs } from '../../ui/tabs';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { CustomNetworks } from './components/custom-networks';
import { DefaultNetworks } from './components/default-networks';

type NetworkTabsProps = {
  initialTab: string;
  showHeader?: boolean;
  onClose?: () => void;
  isPage?: boolean;
};

// Network tabs component
export const NetworkTabs = ({
  initialTab,
  showHeader = true,
  onClose,
  isPage = false,
}: NetworkTabsProps) => {
  const dispatch = useDispatch();
  const t = useI18nContext();
  const [activeTab, setActiveTab] = useState(initialTab);
  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
      return;
    }

    dispatch(hideModal());
  }, [dispatch, onClose]);
  return (
    <Box>
      {showHeader ? (
        <ModalHeader
          onClose={handleClose}
          closeButtonProps={{ 'data-testid': 'modal-header-close-button' }}
        >
          {t('bridgeSelectNetwork')}
        </ModalHeader>
      ) : null}
      <ModalBody style={{ padding: 0 }}>
        <Tabs
          style={{ padding: 0 }}
          activeTab={activeTab}
          onTabClick={setActiveTab}
          tabListProps={{
            className: 'network-manager__tab-list px-4',
          }}
          tabContentProps={{
            className: `network-manager__tab-content ${
              isPage ? 'network-manager__tab-content--page' : ''
            }`,
          }}
        >
          <Tab
            tabKey="networks"
            name={t('networkTabPopular')}
            className="flex-1"
          >
            <DefaultNetworks />
          </Tab>
          <Tab
            tabKey="custom-networks"
            name={t('networkTabCustom')}
            className="flex-1"
          >
            <CustomNetworks />
          </Tab>
        </Tabs>
      </ModalBody>
    </Box>
  );
};
