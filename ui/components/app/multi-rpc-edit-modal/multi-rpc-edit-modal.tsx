import React, { useCallback, useContext, useMemo, useState } from 'react';

import { useDispatch, useSelector } from 'react-redux';
import {
  Modal,
  ModalContent,
  ModalOverlay,
  Button,
  Box,
  Text,
  ModalBody,
  ModalFooter,
  AvatarNetwork,
  AvatarNetworkSize,
  ButtonVariant,
  ModalHeader,
  IconName,
} from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  Display,
  FlexDirection,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { setUseTokenDetection } from '../../../store/actions';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { getProviderConfig } from '../../../ducks/metamask/metamask';
import { getCurrentLocale } from '../../../ducks/locale/locale';
import {
  ENVIRONMENT_TYPE_POPUP,
  ORIGIN_METAMASK,
} from '../../../../shared/constants/app';
import {
  getEditedNetwork,
  getNetworkConfigurationsByChainId,
  getNonTestNetworks,
  getTestNetworks,
} from '../../../selectors';
import { RPCDefinition } from '../../../../shared/constants/network';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import NetworksForm from '../../../pages/settings/networks-tab/networks-form';

type MultiRpcEditModalProps = {
  isOpen: boolean;
  onClose: (arg: boolean) => void;
};
function MultiRpcEditModal({ isOpen, onClose }: MultiRpcEditModalProps) {
  const t = useI18nContext();
  const ACTION_MODES_EDIT = {
    // Displays the search box and network list
    LIST: 'list',
    // Displays the Edit form
    EDIT: 'edit',
  };
  const isPopUp = getEnvironmentType() === ENVIRONMENT_TYPE_POPUP;
  const [actionMode, setActionMode] = useState(ACTION_MODES_EDIT.LIST);
  const [selectedNetwork, setSelectedNetwork] = useState(null);

  const nonTestNetworks = useSelector(getNonTestNetworks);

  // Manage multi-rpc add
  const networkConfigurationsByChainId = useSelector(
    getNetworkConfigurationsByChainId,
  );

  const listNetworks = [...nonTestNetworks].filter(
    (network) => network.removable,
  );

  if (actionMode === ACTION_MODES_EDIT.EDIT && selectedNetwork) {
    const { chainId } = selectedNetwork;
    const stagedUrls = networkConfigurationsByChainId[chainId];
    console.log('IM HERE JJJJJ -------->', stagedUrls);

    const networkToEdit = () => {
      const network = [...nonTestNetworks].find((n) => n.chainId === chainId);

      return network ? { ...network, label: network.nickname } : undefined;
    };

    const networkToUse = networkToEdit();

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
              console.log('ON BACK ...');
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
            <NetworksForm
              addNewNetwork={false}
              restrictHeight
              setActiveOnSubmit
              networksToRender={[]}
              selectedNetwork={networkToUse}
              stagedRpcUrls={stagedUrls}
              stagedBlockExplorers={stagedUrls}
              goToPreviousStep={() => setActionMode(ACTION_MODES_EDIT.LIST)}
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
            Updated RPCs for networks
          </Text>

          <Text
            variant={TextVariant.bodyMd}
            textAlign={TextAlign.Center}
            paddingTop={2}
          >
            We now support multiple RPCs for a single network. Your most recent
            RPC has been selected as the default one to resolve conflicting
            information.
          </Text>

          <Box className="new-network-list__networks-container">
            <Box marginTop={isPopUp ? 0 : 4} marginBottom={1}>
              {listNetworks.map((item, index) => (
                <Box
                  key={index}
                  display={Display.Flex}
                  alignItems={AlignItems.center}
                  justifyContent={JustifyContent.spaceBetween}
                  paddingBottom={4}
                  paddingTop={4}
                  className="new-network-list__list-of-networks"
                >
                  <Box display={Display.Flex} alignItems={AlignItems.center}>
                    <AvatarNetwork
                      size={AvatarNetworkSize.Sm}
                      src={item.rpcPrefs?.imageUrl}
                      name={item.nickname}
                    />
                    <Box marginLeft={4}>
                      <Text
                        color={TextColor.textDefault}
                        backgroundColor={BackgroundColor.transparent}
                        ellipsis
                      >
                        {item.nickname}
                      </Text>
                    </Box>
                  </Box>
                  <Box
                    display={Display.Flex}
                    alignItems={AlignItems.center}
                    marginLeft={1}
                  >
                    <Button
                      type={ButtonVariant.Link}
                      className="add-network__add-button"
                      variant={ButtonVariant.Link}
                      data-testid="test-add-button"
                      onClick={() => {
                        setSelectedNetwork(item);
                        setActionMode(ACTION_MODES_EDIT.EDIT);
                      }}
                    >
                      {t('edit')}
                    </Button>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </ModalBody>
        <ModalFooter
          onSubmit={() => console.log('CLick ...')}
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
