import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
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
  PopoverPosition,
  Popover,
} from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderRadius,
  Display,
  FlexDirection,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  setShowMultiRpcModal,
  setUseTokenDetection,
} from '../../../store/actions';
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
import NetworkListItem from './network-list-item/network-list-item';
import AddUrlModal from '../../multichain/network-list-menu/add-rpc-url-modal/add-rpc-url-modal';
import { cloneDeep } from 'lodash';

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
  };
  const dispatch = useDispatch();
  const isPopUp = getEnvironmentType() === ENVIRONMENT_TYPE_POPUP;
  const [actionMode, setActionMode] = useState(ACTION_MODES_EDIT.LIST);
  const [selectedNetwork, setSelectedNetwork] = useState(null);

  const [stagedRpcUrls, setStagedRpcUrls] = useState({
    rpcEndpoints: [],
    defaultRpcEndpointIndex: null,
  });

  const [stagedBlockExplorers, setStagedBlockExplorers] = useState({
    blockExplorerUrls: [],
    defaultBlockExplorerUrlIndex: undefined,
  });

  const nonTestNetworks = useSelector(getNonTestNetworks);

  // Manage multi-rpc add
  const networkConfigurationsByChainId = useSelector(
    getNetworkConfigurationsByChainId,
  );

  // useEffect(() => {
  //   const network = networkToEdit2
  //     ? networkConfigurationsByChainId[networkToEdit2.chainId]
  //     : {};

  //   setStagedBlockExplorers((prevState) => {
  //     if (prevState.length > 0) {
  //       return {
  //         blockExplorerUrls: [...prevState, ...network.blockExplorerUrls],
  //         defaultBlockExplorerUrlIndex: network.defaultBlockExplorerUrlIndex,
  //       };
  //     }

  //     return setStagedBlockExplorers({
  //       blockExplorerUrls: network.blockExplorerUrls,
  //       defaultBlockExplorerUrlIndex: network.defaultBlockExplorerUrlIndex,
  //     });
  //   });

  //   setStagedRpcUrls((prevState) => {
  //     if (prevState.length > 0) {
  //       return {
  //         // TODO: a deep clone is needed for some reason I can't figure out.
  //         // Otherwise when we splice them below when deleting an rpc url,
  //         // it somehow modifies the version in state, breaking state selectors
  //         rpcEndpoints: [...prevState, ...cloneDeep(network.rpcEndpoints)],
  //         defaultRpcEndpointIndex: network.defaultRpcEndpointIndex,
  //       };
  //     }
  //     return setStagedRpcUrls({
  //       rpcEndpoints: cloneDeep(network.rpcEndpoints),
  //       defaultRpcEndpointIndex: network.defaultRpcEndpointIndex,
  //     });
  //   });
  // }, []);

  const networkToEdit = (chainId: string) => {
    const network = [...nonTestNetworks].find((n) => n.chainId === chainId);
    return network ? { ...network, label: network.nickname } : undefined;
  };

  const listNetworks = [...nonTestNetworks];

  if (actionMode === ACTION_MODES_EDIT.EDIT && selectedNetwork) {
    const { chainId } = selectedNetwork;
    const stagedUrls = networkConfigurationsByChainId[chainId];

    console.log('stagedUrls ....', stagedUrls);

    const networkToUse = networkToEdit(chainId);

    // extract this to another component
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
            <NetworksForm
              addNewNetwork={false}
              restrictHeight
              setActiveOnSubmit
              networksToRender={[]}
              selectedNetwork={networkToUse}
              stagedRpcUrls={stagedUrls}
              stagedBlockExplorers={stagedUrls}
              goToPreviousStep={() => {
                setActionMode(ACTION_MODES_EDIT.LIST);
                return null;
              }}
              onRpcUrlAdd={() => setActionMode(ACTION_MODES_EDIT.ADD_RPC)}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
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
            Edit network information
          </ModalHeader>
          <ModalBody
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
          >
            <AddUrlModal
              isRpc
              onUrlAdded={(rpcUrl) => {
                // if (
                //   !rpcUrl ||
                //   stagedRpcUrls.rpcEndpoints.some((rpc) => rpc.url === rpcUrl)
                // ) {
                //   setActionMode(ACTION_MODES_EDIT.EDIT);
                //   return;
                // }
                setActionMode(ACTION_MODES_EDIT.EDIT);
                return;

                // setStagedRpcUrls({
                //   rpcEndpoints: [
                //     ...stagedRpcUrls.rpcEndpoints,
                //     {
                //       url: rpcUrl,
                //       type: RpcEndpointType.Custom,
                //     },
                //   ],
                //   defaultRpcEndpointIndex: stagedRpcUrls.rpcEndpoints.length,
                // });
                // console.log(rpcUrl);

                // setActionMode(prevActionMode);
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
              {listNetworks.map((item, index) => {
                if (
                  networkConfigurationsByChainId?.[item.chainId]?.rpcEndpoints
                    .length < 2
                ) {
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
