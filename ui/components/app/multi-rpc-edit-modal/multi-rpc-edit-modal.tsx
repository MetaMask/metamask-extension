import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Modal,
  ModalContent,
  ModalOverlay,
  ModalBody,
  ModalFooter,
  Box,
  Text,
} from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  AlignItems,
  Display,
  FlexDirection,
  JustifyContent,
  BorderRadius,
  TextAlign,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { setShowMultiRpcModal } from '../../../store/actions';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { getNetworkConfigurationsByChainId } from '../../../selectors';
import { ENVIRONMENT_TYPE_POPUP } from '../../../../shared/constants/app';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../../shared/constants/network';
import NetworkListItem from './network-list-item/network-list-item';

type MultiRpcEditModalProps = {
  isOpen: boolean;
};

function MultiRpcEditModal({ isOpen }: MultiRpcEditModalProps) {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const isPopUp = getEnvironmentType() === ENVIRONMENT_TYPE_POPUP;

  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);

  const listNetworks = [...Object.values(networkConfigurations)];

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => dispatch(setShowMultiRpcModal(true))}
      isClosedOnOutsideClick={false}
      isClosedOnEscapeKey={false}
      className="mm-modal__custom-scrollbar auto-detect-in-modal"
      data-testid="multi-rpc-edit-modal"
      autoFocus={false}
    >
      <ModalOverlay />
      <ModalContent
        modalDialogProps={{ className: 'multi-rpc-edit-modal__dialog' }}
      >
        <ModalBody display={Display.Flex} flexDirection={FlexDirection.Column}>
          <Box
            display={Display.Flex}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
            borderRadius={BorderRadius.SM}
          >
            <img src="/images/networks1.png" />
          </Box>
          <Text variant={TextVariant.bodyMdBold} textAlign={TextAlign.Center}>
            {t('updatedRpcForNetworks')}
          </Text>

          <Text
            variant={TextVariant.bodyMd}
            textAlign={TextAlign.Center}
            paddingTop={2}
          >
            {t('supportMultiRpcInformation')}
          </Text>

          <Box className="new-network-list__networks-container">
            <Box marginTop={isPopUp ? 0 : 4} marginBottom={1}>
              {listNetworks.map((item, index) => {
                const networkRpcEndpoints =
                  networkConfigurations?.[item.chainId]?.rpcEndpoints;

                if (networkRpcEndpoints.length < 2) {
                  return null;
                }

                const selectedRpc =
                  networkRpcEndpoints?.[item.defaultRpcEndpointIndex];

                const networkToUse = {
                  nickname: item.name,
                  chainId: item.chainId,
                  rpcPrefs: {
                    imageUrl:
                      CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
                        item.chainId as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP
                      ],
                  },
                  rpcUrl: selectedRpc.url,
                };

                return (
                  <NetworkListItem
                    key={index}
                    item={networkToUse}
                    index={index}
                    rpcName={selectedRpc?.name ?? ''}
                    setSelectedNetwork={() => ({})}
                    setActionMode={() => ({})}
                  />
                );
              })}
            </Box>
          </Box>
        </ModalBody>
        <ModalFooter
          onSubmit={() => {
            dispatch(setShowMultiRpcModal(true));
          }}
          submitButtonProps={{
            children: t('accept'),
            block: true,
          }}
        />
      </ModalContent>
    </Modal>
  );
}

export default MultiRpcEditModal;
