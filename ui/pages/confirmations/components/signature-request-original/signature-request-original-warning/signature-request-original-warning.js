import React from 'react';
import PropTypes from 'prop-types';
import { useI18nContext } from '../../../../../hooks/useI18nContext';

import {
  IconColor,
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
  TextVariant,
  AlignItems,
  TextAlign,
  BlockSize,
} from '../../../../../helpers/constants/design-system';
import { shortenAddress } from '../../../../../helpers/utils/util';
import {
  Icon,
  IconName,
  Box,
  Text,
  ButtonVariant,
  Modal,
  ModalContent,
  ModalFooter,
  ModalBody,
  ModalHeader,
  AvatarAccount,
  AvatarAccountSize,
  IconSize,
  ModalOverlay,
} from '../../../../../components/component-library';

const SignatureRequestOriginalWarning = ({
  senderAddress,
  name,
  onSubmit,
  onCancel,
}) => {
  const t = useI18nContext();

  return (
    <Modal isOpen className="signature-request-warning__content">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader
          display={Display.Flex}
          childrenWrapperProps={{
            display: Display.Flex,
            alignItems: AlignItems.center,
            justifyContent: JustifyContent.center,
            flexDirection: FlexDirection.Column,
            gap: 4,
            width: BlockSize.Full,
          }}
        >
          <Icon
            name={IconName.Danger}
            color={IconColor.errorDefault}
            size={IconSize.Xl}
          />
          <Text variant={TextVariant.headingSm} textAlign={TextAlign.Center}>
            {t('yourFundsMayBeAtRisk')}
          </Text>
        </ModalHeader>
        <ModalBody
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          gap={4}
        >
          <Box
            display={Display.Flex}
            gap={4}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
          >
            <AvatarAccount
              address={senderAddress}
              size={AvatarAccountSize.Lg}
            />
            <Text
              variant={TextVariant.bodyMd}
              className="signature-request-warning__content__account-name"
            >
              <b>{name}</b> {` (${shortenAddress(senderAddress)})`}
            </Text>
          </Box>
          <Text color={TextColor.textAlternative}>
            {t('signatureRequestWarning', [
              <a
                href="https://consensys.io/blog/the-seal-of-approval-know-what-youre-consenting-to-with-permissions-and-approvals-in-metamask"
                target="_blank"
                type="link"
                key="non_custodial_link"
                rel="noopener noreferrer"
                style={{ color: 'var(--color-primary-default)' }}
              >
                {t('learnMoreUpperCase')}
              </a>,
            ])}
          </Text>
        </ModalBody>
        <ModalFooter
          onSubmit={onSubmit}
          submitButtonProps={{
            danger: true,
            children: t('sign'),
            'data-testid': 'signature-warning-sign-button',
          }}
          onCancel={onCancel}
          cancelButtonProps={{
            variant: ButtonVariant.Secondary,
            children: t('reject'),
          }}
        />
      </ModalContent>
    </Modal>
  );
};

SignatureRequestOriginalWarning.propTypes = {
  senderAddress: PropTypes.string,
  name: PropTypes.string,
  onSubmit: PropTypes.func,
  onCancel: PropTypes.func,
};

export default SignatureRequestOriginalWarning;
