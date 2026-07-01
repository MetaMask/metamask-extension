import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  ButtonIconSize,
  ButtonSize,
  ButtonVariant,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Modal,
  ModalFooter,
  ModalHeader,
  ModalContent,
  ModalOverlay,
  Text,
  TextAlign,
  TextVariant,
} from '@metamask/design-system-react';
import { I18nContext } from '../../../../contexts/i18n';

export default class ConfirmDeleteNetwork extends PureComponent {
  static propTypes = {
    hideModal: PropTypes.func.isRequired,
    removeNetwork: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    networkNickname: PropTypes.string.isRequired,
    chainId: PropTypes.string.isRequired,
    isChainToDeleteSelected: PropTypes.bool,
    switchToEthereumNetwork: PropTypes.func,
  };

  static contextType = I18nContext;

  handleDelete = async () => {
    const {
      chainId,
      onConfirm,
      hideModal,
      removeNetwork,
      isChainToDeleteSelected,
      switchToEthereumNetwork,
    } = this.props;

    // NOTE: We only support EVM networks removal, so the conversion is safe here.
    const caipChainId = toEvmCaipChainId(chainId);

    // NOTE: ensure that we are not deleting a selected evm chain
    if (isChainToDeleteSelected) {
      await switchToEthereumNetwork?.();
    }

    await removeNetwork(caipChainId);

    onConfirm();
    hideModal();
  };

  render() {
    const t = this.context;
    const { networkNickname } = this.props;

    return (
      <Modal
        isOpen
        onClose={() => this.props.hideModal()}
        data-testid="confirm-delete-network-modal"
      >
        <ModalOverlay />
        <ModalContent
          modalDialogProps={{
            className: 'overflow-hidden p-4 shadow-lg',
          }}
          className="items-center p-4 sm:py-6 md:py-6"
        >
          <ModalHeader
            className="items-start px-0 pb-4"
            onClose={() => this.props.hideModal()}
            closeButtonProps={{
              ariaLabel: t('close'),
              size: ButtonIconSize.Md,
            }}
          >
            <Box
              flexDirection={BoxFlexDirection.Column}
              alignItems={BoxAlignItems.Center}
              gap={2}
              className="min-w-0"
            >
              <Icon
                name={IconName.Danger}
                size={IconSize.Xl}
                color={IconColor.ErrorDefault}
              />
              <Text
                asChild
                variant={TextVariant.HeadingSm}
                textAlign={TextAlign.Center}
              >
                <h2>{t('deleteNetworkTitle', [networkNickname])}</h2>
              </Text>
            </Box>
          </ModalHeader>
          <Text className="w-full" variant={TextVariant.BodyMd}>
            {t('deleteNetworkIntro')}
          </Text>
          <ModalFooter
            className="px-0 pt-6"
            secondaryButtonProps={{
              children: t('cancel'),
              onClick: () => this.props.hideModal(),
              size: ButtonSize.Lg,
              variant: ButtonVariant.Secondary,
            }}
            primaryButtonProps={{
              children: t('delete'),
              'data-testid': 'confirm-delete-network-modal-delete-button',
              isDanger: true,
              onClick: this.handleDelete,
              size: ButtonSize.Lg,
              variant: ButtonVariant.Primary,
            }}
          />
        </ModalContent>
      </Modal>
    );
  }
}
