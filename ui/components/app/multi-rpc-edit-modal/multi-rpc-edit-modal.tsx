import React from 'react';
import { useDispatch } from 'react-redux';
import { Hex } from '@metamask/utils';
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
import { ENVIRONMENT_TYPE_POPUP } from '../../../../shared/constants/app';
import NetworkListItem from './network-list-item/network-list-item';

function MultiRpcEditModal() {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const isPopUp = getEnvironmentType() === ENVIRONMENT_TYPE_POPUP;

  // TODO: useSelector(getNetworkConfigurationsByChainId) with network controller v21 upgrade
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const networkConfigurations = {} as Record<Hex, any>;

  return (
    <Modal
      isOpen={true}
      onClose={() => dispatch(setShowMultiRpcModal(false))}
      isClosedOnOutsideClick={false}
      isClosedOnEscapeKey={false}
      data-testid="multi-rpc-edit-modal"
      autoFocus={false}
    >
      <ModalOverlay />
      <ModalContent>
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

          <Box paddingBottom={6}>
            <Box marginTop={isPopUp ? 0 : 4} marginBottom={1}>
              {Object.values(networkConfigurations).map(
                (networkConfiguration) =>
                  networkConfiguration.rpcEndpoints.length > 1 ? (
                    <NetworkListItem
                      networkConfiguration={networkConfiguration}
                      key={networkConfiguration.chainId}
                    />
                  ) : null,
              )}
            </Box>
          </Box>
        </ModalBody>
        <ModalFooter
          onSubmit={() => {
            dispatch(setShowMultiRpcModal(false));
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
