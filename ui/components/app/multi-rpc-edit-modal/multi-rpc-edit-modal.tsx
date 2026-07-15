import React from 'react';
import { useSelector } from 'react-redux';
import { NetworkConfiguration } from '@metamask/network-controller';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
} from '@metamask/design-system-react';
import {
  Modal,
  ModalContent,
  ModalOverlay,
  ModalBody,
  ModalFooter,
  Text,
} from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  Display,
  FlexDirection,
  TextAlign,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { setShowMultiRpcModal } from '../../../store/actions';
import { getEnvironmentType } from '../../../../shared/lib/environment-type';
import { getNetworkConfigurationsByChainId } from '../../../../shared/lib/selectors/networks';
import { ENVIRONMENT_TYPE_POPUP } from '../../../../shared/constants/app';
import { useAppDispatch } from '../../../store/hooks';
import NetworkListItem from './network-list-item/network-list-item';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
function MultiRpcEditModal() {
  const t = useI18nContext();
  const dispatch = useAppDispatch();
  const isPopUp = getEnvironmentType() === ENVIRONMENT_TYPE_POPUP;
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);

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
            className="flex rounded-sm"
            alignItems={BoxAlignItems.Center}
            justifyContent={BoxJustifyContent.Center}
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
                (networkConfiguration: NetworkConfiguration) =>
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
