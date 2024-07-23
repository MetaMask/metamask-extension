import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { cloneDeep } from 'lodash';
import { RpcEndpointType } from '@metamask/network-controller';
import {
  Modal,
  ModalContent,
  ModalOverlay,
  ModalBody,
  ModalFooter,
  Box,
  Text,
  ModalHeader,
  IconName,
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
import {
  getNonTestNetworks,
  getNetworkConfigurationsByChainId,
} from '../../../selectors';
import { ENVIRONMENT_TYPE_POPUP } from '../../../../shared/constants/app';
import NetworkListItem from './network-list-item/network-list-item';
import StagedNetworkSettings from './staged-network-settings/staged-network-settings';
import AddRpcUrlModal from '../../multichain/network-list-menu/add-rpc-url-modal/add-rpc-url-modal';
import { useNetworkFormState } from '../../../pages/settings/networks-tab/networks-form/networks-form-state';
import AddBlockExplorerModal from '../../multichain/network-list-menu/add-block-explorer-modal/add-block-explorer-modal';

type MultiRpcEditModalProps = {
  isOpen: boolean;
  onClose: (arg: boolean) => void;
  setShowMultiRpcModalUpgrade: (arg: boolean) => void;
};

function MultiRpcEditModal({
  isOpen,
  onClose,
  setShowMultiRpcModalUpgrade,
}: MultiRpcEditModalProps) {
  const t = useI18nContext();
  const ACTION_MODES_EDIT = {
    LIST: 'list',
    EDIT: 'edit',
    ADD_RPC: 'add_rpc',
    ADD_BLOCK_EXPLORER: 'add_block_explorer',
  };
  const dispatch = useDispatch();
  const isPopUp = getEnvironmentType() === ENVIRONMENT_TYPE_POPUP;
  const [actionMode, setActionMode] = useState(ACTION_MODES_EDIT.LIST);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedNetwork, setSelectedNetwork] = useState<any>(null);
  const nonTestNetworks = useSelector(getNonTestNetworks);
  const networkConfigurationsByChainId = useSelector(
    getNetworkConfigurationsByChainId,
  );

  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);

  const editedNetwork = useMemo(
    () =>
      Object.entries(networkConfigurations).find(
        ([chainId]) => chainId === selectedNetwork?.chainId,
      )?.[1],
    [networkConfigurations, selectedNetwork],
  );

  const networkFormState = useNetworkFormState(editedNetwork);
  const { rpcUrls, setRpcUrls, blockExplorers, setBlockExplorers } =
    networkFormState;

  const listNetworks = [...nonTestNetworks];

  if (actionMode === ACTION_MODES_EDIT.EDIT && selectedNetwork) {
    return (
      <StagedNetworkSettings
        networkFormState={networkFormState}
        editedNetwork={editedNetwork}
        isOpen={isOpen}
        onClose={onClose}
        setActionMode={setActionMode}
      />
    );
  } else if (actionMode === ACTION_MODES_EDIT.ADD_RPC) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={() => onClose(true)}
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
          <ModalHeader
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
            onBack={() => {
              setActionMode(ACTION_MODES_EDIT.LIST);
            }}
            backButtonProps={{
              'data-testid': 'back',
              ariaLabel: '',
              iconName: IconName.ArrowLeft,
            }}
          >
            {t('editNetworkInformation')}
          </ModalHeader>
          <ModalBody
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
          >
            <AddRpcUrlModal
              onAdded={(rpcUrl, name) => {
                if (
                  !rpcUrl ||
                  networkFormState.rpcUrls.rpcEndpoints.some(
                    (rpc) => rpc.url === rpcUrl,
                  )
                ) {
                  setActionMode(ACTION_MODES_EDIT.EDIT);
                  return;
                }

                setRpcUrls({
                  rpcEndpoints: [
                    ...rpcUrls.rpcEndpoints,
                    { url: rpcUrl, name, type: RpcEndpointType.Custom },
                  ],
                  defaultRpcEndpointIndex: rpcUrls.rpcEndpoints.length,
                });

                setActionMode(ACTION_MODES_EDIT.EDIT);
              }}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  } else if (actionMode === ACTION_MODES_EDIT.ADD_BLOCK_EXPLORER) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={() => onClose(true)}
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
          <ModalHeader
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
            onBack={() => {
              setActionMode(ACTION_MODES_EDIT.LIST);
            }}
            backButtonProps={{
              'data-testid': 'back',
              ariaLabel: '',
              iconName: IconName.ArrowLeft,
            }}
          >
            Edit network information
          </ModalHeader>
          <ModalBody
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
          >
            <AddBlockExplorerModal
              onAdded={(url) => {
                if (blockExplorers.blockExplorerUrls?.every((u) => u !== url)) {
                  setBlockExplorers({
                    blockExplorerUrls: [
                      ...blockExplorers.blockExplorerUrls,
                      url,
                    ],
                    defaultBlockExplorerUrlIndex:
                      blockExplorers.blockExplorerUrls.length,
                  });
                }
                setActionMode(ACTION_MODES_EDIT.EDIT);
              }}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => onClose(true)}
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
                return (
                  <NetworkListItem
                    key={index}
                    item={item}
                    index={index}
                    setSelectedNetwork={setSelectedNetwork}
                    setActionMode={setActionMode}
                  />
                );
              })}
            </Box>
          </Box>
        </ModalBody>
        <ModalFooter
          onSubmit={() => {
            dispatch(setShowMultiRpcModal(true));
            setShowMultiRpcModalUpgrade(true);
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
