import React, { useCallback, useState } from 'react';
import { hideModal } from '../../../store/actions';
import { ModalHeader, ModalBody, Box } from '../../component-library';
import { Tab, Tabs } from '../../ui/tabs';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useDispatch } from '../../../store/hooks';
import NetworkListSearch from '../network-list-menu/network-list-search/network-list-search';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [, setFocusSearch] = useState(false);
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
        <NetworkListSearch
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setFocusSearch={setFocusSearch}
        />
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
            <DefaultNetworks searchQuery={searchQuery} />
          </Tab>
          <Tab
            tabKey="custom-networks"
            name={t('networkTabCustom')}
            className="flex-1"
          >
            <CustomNetworks searchQuery={searchQuery} />
          </Tab>
        </Tabs>
      </ModalBody>
    </Box>
  );
};
