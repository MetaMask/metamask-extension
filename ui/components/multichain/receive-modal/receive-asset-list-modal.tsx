import React from 'react';
import { Modal, ModalOverlay, ModalContent, ModalHeader, Box } from '../../component-library';
import AssetList from '../../app/assets/asset-list/asset-list';
import { useI18nContext } from '../../../hooks/useI18nContext';

interface ReceiveAssetListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAsset: (chainId: string, address: string, token: any) => void;
}

const ReceiveAssetListModal: React.FC<ReceiveAssetListModalProps> = ({ isOpen, onClose, onSelectAsset }) => {
  const t = useI18nContext();

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onClose}>{t('receive')}</ModalHeader>
        <Box>
          <AssetList
            onClickAsset={(chainId, address, token) => {
              onSelectAsset(chainId, address, token);
              onClose();
            }}
          />
        </Box>
      </ModalContent>
    </Modal>
  );
};

export default ReceiveAssetListModal;
