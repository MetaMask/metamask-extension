import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Button,
  ButtonSize,
  ButtonVariant,
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  TextAlign,
  TextButton,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { BaseUrl } from '../../../../shared/constants/urls';
import { useI18nContext } from '../../../hooks/useI18nContext';

const supportedProvidersLinkClassName =
  'underline underline-offset-2 hover:underline';

export type PasskeyMigrationModalProps = Readonly<{
  onReplacePasskey: () => void;
  onRemindMeLater: () => void;
}>;

/**
 * Prompts legacy passkey users to replace their passkey.
 *
 * The replacement operation is intentionally supplied by the parent so the
 * modal can be shipped independently from the passkey-controller migration
 * API.
 *
 * @param options0 - Component props.
 * @param options0.onReplacePasskey - Called when the user chooses to replace
 * the passkey.
 * @param options0.onRemindMeLater - Called when the user postpones the
 * replacement.
 */
export default function PasskeyMigrationModal({
  onReplacePasskey,
  onRemindMeLater,
}: PasskeyMigrationModalProps) {
  const t = useI18nContext();

  return (
    <Modal
      isOpen
      onClose={onRemindMeLater}
      isClosedOnOutsideClick={false}
      isClosedOnEscapeKey={false}
      data-testid="passkey-migration-modal"
    >
      <ModalOverlay />
      <ModalContent
        className="items-center"
        modalDialogProps={{
          flexDirection: BoxFlexDirection.Column,
        }}
      >
        <ModalHeader className="flex w-full flex-col items-stretch">
          <Box
            flexDirection={BoxFlexDirection.Column}
            gap={4}
            className="w-full"
          >
            <Box
              flexDirection={BoxFlexDirection.Row}
              alignItems={BoxAlignItems.Center}
              justifyContent={BoxJustifyContent.Center}
              className="w-full"
            >
              <img
                src="images/biometric.png"
                alt="Biometrics"
                width={160}
                height={160}
              />
            </Box>
            <Text
              variant={TextVariant.HeadingMd}
              color={TextColor.TextDefault}
              textAlign={TextAlign.Left}
              className="w-full"
            >
              {t('passkeyMigrationTitle')}
            </Text>
          </Box>
        </ModalHeader>

        <Box
          flexDirection={BoxFlexDirection.Column}
          gap={4}
          paddingHorizontal={4}
          marginBottom={4}
          className="w-full"
        >
          <Text
            variant={TextVariant.BodySm}
            color={TextColor.TextAlternative}
            data-testid="passkey-migration-description-1"
          >
            {t('passkeyMigrationDescription1')}
          </Text>
          <Text
            variant={TextVariant.BodySm}
            color={TextColor.TextAlternative}
            data-testid="passkey-migration-description-2"
          >
            {t('passkeyMigrationDescription2', [
              <TextButton
                asChild
                key="passkey-migration-supported-providers"
                color={TextColor.PrimaryDefault}
                className={supportedProvidersLinkClassName}
              >
                <a
                  href={BaseUrl.MetaMask}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="passkey-migration-supported-providers-link"
                >
                  {t('passkeyMigrationSupportedProviders')}
                </a>
              </TextButton>,
            ])}
          </Text>
          <Text
            variant={TextVariant.BodySm}
            color={TextColor.TextAlternative}
            data-testid="passkey-migration-description-3"
          >
            {t('passkeyMigrationDescription3')}
          </Text>
        </Box>

        <Box
          flexDirection={BoxFlexDirection.Column}
          gap={3}
          paddingHorizontal={4}
          className="w-full"
        >
          <Button
            variant={ButtonVariant.Primary}
            size={ButtonSize.Lg}
            className="w-full"
            data-testid="passkey-migration-modal-replace-button"
            onClick={onReplacePasskey}
          >
            {t('replacePasskey')}
          </Button>
          <TextButton
            type="button"
            color={TextColor.PrimaryDefault}
            className="w-full"
            data-testid="passkey-migration-modal-remind-me-later-button"
            onClick={onRemindMeLater}
          >
            {t('remindMeLater')}
          </TextButton>
        </Box>
      </ModalContent>
    </Modal>
  );
}
