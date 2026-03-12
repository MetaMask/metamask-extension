import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Text,
  TextButton,
  TextButtonSize,
  TextColor,
  TextVariant,
  TextAlign,
  ButtonVariant,
} from '@metamask/design-system-react';
import {
  Modal,
  ModalContent,
  ModalOverlay,
  ModalBody,
  ModalHeader,
  ModalFooter,
  type ButtonVariant as ButtonVariantComponentLibrary,
} from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MUSD_CONVERSION_BONUS_TERMS_OF_USE } from './constants';

const MUSD_COIN_IMAGE = './images/musd-icon-no-background-2x.png';

type MerklClaimModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
};

export const MerklClaimModal: React.FC<MerklClaimModalProps> = ({
  isOpen,
  onClose,
  onContinue,
}) => {
  const t = useI18nContext();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      data-testid="merkl-claim-modal"
      autoFocus={false}
      onClick={(e: React.MouseEvent) => e.stopPropagation()}
    >
      <ModalOverlay onClick={(e) => e.stopPropagation()} />
      <ModalContent>
        <ModalHeader
          onClose={onClose}
          closeButtonProps={{ 'data-testid': 'merkl-claim-modal-close-button' }}
          paddingTop={1}
        >
          {t('merklClaimModalTitle')}
        </ModalHeader>
        <ModalBody>
          <Box
            flexDirection={BoxFlexDirection.Column}
            alignItems={BoxAlignItems.Center}
            justifyContent={BoxJustifyContent.Center}
            gap={2}
          >
            <img
              className="mt-2 mb-4"
              src={MUSD_COIN_IMAGE}
              alt="mUSD"
              width={127}
              height={127}
              data-testid="merkl-claim-modal-coin-image"
            />
            <Text
              className="pl-4 pr-4 pb-2"
              variant={TextVariant.BodyMd}
              color={TextColor.TextAlternative}
              textAlign={TextAlign.Center}
            >
              {t('merklClaimModalDescription', [
                <TextButton
                  key="terms-link"
                  size={TextButtonSize.BodyMd}
                  asChild
                >
                  <a
                    href={MUSD_CONVERSION_BONUS_TERMS_OF_USE}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'inherit', textDecoration: 'underline' }}
                  >
                    {t('musdTermsApply')}
                  </a>
                </TextButton>,
              ])}
            </Text>
          </Box>
        </ModalBody>
        <ModalFooter
          onSubmit={onContinue}
          submitButtonProps={{
            children: t('continue'),
            block: true,
            variant:
              ButtonVariant.Primary as unknown as ButtonVariantComponentLibrary,
            'data-testid': 'merkl-claim-modal-continue-button',
          }}
        />
      </ModalContent>
    </Modal>
  );
};
