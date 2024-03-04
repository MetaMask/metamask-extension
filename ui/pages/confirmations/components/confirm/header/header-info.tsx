import React from 'react';
import { useSelector } from 'react-redux';
import {
  AvatarAccount,
  AvatarAccountSize,
  AvatarAccountVariant,
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from '../../../../../components/component-library';
import {
  Display,
  JustifyContent,
} from '../../../../../helpers/constants/design-system';
import { ConfirmInfoRow } from '../../../../../components/app/confirm/info/row';
import { AddressCopyButton } from '../../../../../components/multichain';
import Tooltip from '../../../../../components/ui/tooltip/tooltip';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import useConfirmationRecipientInfo from '../../../hooks/useConfirmationRecipientInfo';
import { getUseBlockie } from '../../../../../selectors';

const HeaderInfo = () => {
  const useBlockie = useSelector(getUseBlockie);
  const [showAccountInfo, setShowAccountInfo] = React.useState(false);
  const { recipientAddress } = useConfirmationRecipientInfo();

  const t = useI18nContext();

  return (
    <>
      <Box display={Display.Flex} justifyContent={JustifyContent.flexEnd}>
        <Tooltip position="bottom" title={t('accountDetails')} interactive>
          <ButtonIcon
            ariaLabel={t('accountDetails')}
            iconName={IconName.Info}
            size={ButtonIconSize.Md}
            onClick={() => setShowAccountInfo(true)}
          />
        </Tooltip>
      </Box>
      <Modal
        isOpen={showAccountInfo}
        onClose={() => setShowAccountInfo(false)}
        data-testid="account-details-modal"
        isClosedOnEscapeKey={false}
        isClosedOnOutsideClick={false}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <Box display={Display.Flex} justifyContent={JustifyContent.center}>
              <AvatarAccount
                variant={
                  useBlockie
                    ? AvatarAccountVariant.Blockies
                    : AvatarAccountVariant.Jazzicon
                }
                address={recipientAddress}
                size={AvatarAccountSize.Lg}
                style={{ margin: '0 auto' }}
              />
              <Box
                display={Display.Flex}
                justifyContent={JustifyContent.flexEnd}
              >
                <ButtonIcon
                  ariaLabel={t('close')}
                  iconName={IconName.Close}
                  size={ButtonIconSize.Sm}
                  className="confirm_header__close-button"
                  onClick={() => setShowAccountInfo(false)}
                />
              </Box>
            </Box>
          </ModalHeader>
          <ModalBody>
            <ConfirmInfoRow label="Account address">
              <AddressCopyButton address={recipientAddress} shorten={true} />
            </ConfirmInfoRow>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default HeaderInfo;
