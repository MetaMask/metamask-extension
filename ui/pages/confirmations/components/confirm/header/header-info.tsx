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
  Text,
} from '../../../../../components/component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  FontWeight,
  JustifyContent,
} from '../../../../../helpers/constants/design-system';
import { ConfirmInfoRow } from '../../../../../components/app/confirm/info/row';
import { AddressCopyButton } from '../../../../../components/multichain';
import Tooltip from '../../../../../components/ui/tooltip/tooltip';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import useConfirmationRecipientInfo from '../../../hooks/useConfirmationRecipientInfo';
import { getUseBlockie } from '../../../../../selectors';
import { ConfirmInfoRowCurrency } from '../../../../../components/app/confirm/info/row/currency';
import { useBalance } from '../../../hooks/useBalance';

const HeaderInfo = () => {
  const useBlockie = useSelector(getUseBlockie);
  const [showAccountInfo, setShowAccountInfo] = React.useState(false);
  const { recipientAddress: fromAddress, recipientName: fromName } =
    useConfirmationRecipientInfo();

  const t = useI18nContext();

  const { balance: balanceToUse } = useBalance(fromAddress);

  return (
    <>
      <Box
        display={Display.Flex}
        justifyContent={JustifyContent.flexEnd}
        style={{
          alignSelf: 'flex-end',
        }}
      >
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
              <Box
                style={{ margin: '0 auto' }}
                display={Display.Flex}
                justifyContent={JustifyContent.center}
                flexDirection={FlexDirection.Column}
                alignItems={AlignItems.center}
              >
                <AvatarAccount
                  variant={
                    useBlockie
                      ? AvatarAccountVariant.Blockies
                      : AvatarAccountVariant.Jazzicon
                  }
                  address={fromAddress}
                  size={AvatarAccountSize.Lg}
                />
                <Text fontWeight={FontWeight.Bold} marginTop={2}>
                  {fromName}
                </Text>
              </Box>
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
              <AddressCopyButton address={fromAddress} shorten={true} />
            </ConfirmInfoRow>
            <ConfirmInfoRow label="Balance">
              <ConfirmInfoRowCurrency value={balanceToUse ?? 0} />
            </ConfirmInfoRow>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default HeaderInfo;
