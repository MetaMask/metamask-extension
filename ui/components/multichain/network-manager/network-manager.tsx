import React, { useCallback } from 'react';
import {
  AlignItems,
  Display,
  FlexDirection,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import {
  ButtonLink,
  ButtonLinkSize,
  Modal,
  ModalContent,
  ModalContentSize,
  ModalHeader,
} from '../../component-library';
import { Box } from '../../component-library/box';
import { Tab, Tabs } from '../../ui/tabs';
import { AdditionalNetworkItem } from './components/additional-network-item';
import { AdditionalNetworksInfo } from './components/additional-networks-info';
import { NetworkListItem } from './components/network-list-item';
import { TotalBalance } from './components/total-balance';

export type NetworkItemProps = {
  name: string;
  src: string;
  balance?: string;
  isChecked?: boolean;
  onCheckboxChange?: () => void;
  onMoreOptionsClick?: () => void;
};

export const NetworkManager = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  // const allNetworks = useSelector(getNetworkConfigurationsByChainId);
  // const allNetworksArray = Object.values(allNetworks);
  const handleSelectAll = useCallback(() => {
    console.log('select all');
  }, []);

  const handleNetworkCheckboxChange = useCallback(() => {
    console.log('network checkbox changed');
  }, []);

  const handleNetworkMoreOptionsClick = useCallback(() => {
    console.log('network more options clicked');
  }, []);

  const handleAddNetwork = useCallback(() => {
    console.log('add network clicked');
  }, []);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent size={ModalContentSize.Md}>
        <ModalHeader onClose={onClose}>Networks</ModalHeader>
        <Tabs
          defaultActiveTabKey="networks"
          onTabClick={() => {}}
          tabListProps={{
            className: 'network-manager__tab-list',
          }}
          padding={4}
        >
          <Tab tabKey="networks" name="Default">
            <Box
              justifyContent={JustifyContent.spaceBetween}
              alignItems={AlignItems.center}
              flexDirection={FlexDirection.Row}
              display={Display.Flex}
              paddingTop={4}
              paddingBottom={3}
            >
              <ButtonLink size={ButtonLinkSize.Sm} onClick={handleSelectAll}>
                Deselect All
              </ButtonLink>
              <TotalBalance />
            </Box>
            <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
              <NetworkListItem
                name="Arbitrum One"
                src="./images/arbitrum.svg"
                balance=""
                isChecked={true}
                onCheckboxChange={handleNetworkCheckboxChange}
                onMoreOptionsClick={handleNetworkMoreOptionsClick}
              />
              <NetworkListItem
                name="Optimism"
                src="./images/optimism.svg"
                balance="$12.00"
                isChecked={true}
                onCheckboxChange={handleNetworkCheckboxChange}
                onMoreOptionsClick={handleNetworkMoreOptionsClick}
              />
              <NetworkListItem
                name="Avalanche"
                src="./images/avax-token.svg"
                balance="$12.00"
                isChecked={true}
                onCheckboxChange={handleNetworkCheckboxChange}
                onMoreOptionsClick={handleNetworkMoreOptionsClick}
              />
            </Box>
            <AdditionalNetworksInfo />
            <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
              <AdditionalNetworkItem
                name="Base"
                src="./images/base.svg"
                onClick={handleAddNetwork}
              />
            </Box>
          </Tab>
          <Tab tabKey="networks1" name="Custom">
            <div>Networks 1</div>
          </Tab>
          <Tab tabKey="networks2" name="Test">
            <div>Networks 2</div>
          </Tab>
        </Tabs>
      </ModalContent>
    </Modal>
  );
};
