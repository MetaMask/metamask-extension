import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventLocation,
  MetaMetricsEventName,
} from '../../../../../../shared/constants/metametrics';
import { ConfirmInfoRow } from '../../../../../components/app/confirm/info/row';
import { ConfirmInfoRowCurrency } from '../../../../../components/app/confirm/info/row/currency';
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
import { AddressCopyButton } from '../../../../../components/multichain';
import Tooltip from '../../../../../components/ui/tooltip/tooltip';
import { MetaMetricsContext } from '../../../../../contexts/metametrics';
import {
  AlignItems,
  Display,
  FlexDirection,
  FontWeight,
  IconColor,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  currentConfirmationSelector,
  getUseBlockie,
} from '../../../../../selectors';
import { useBalance } from '../../../hooks/useBalance';
import useConfirmationRecipientInfo from '../../../hooks/useConfirmationRecipientInfo';

const HeaderInfo = () => {
  const useBlockie = useSelector(getUseBlockie);
  const [showAccountInfo, setShowAccountInfo] = React.useState(false);

  const currentConfirmation = useSelector(currentConfirmationSelector);
  const { senderAddress: fromAddress, senderName: fromName } =
    useConfirmationRecipientInfo();

  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);

  const { balance: balanceToUse } = useBalance(fromAddress);

  function trackAccountModalOpened() {
    trackEvent({
      category: MetaMetricsEventCategory.Transactions,
      event: MetaMetricsEventName.AccountDetailsOpened,
      properties: {
        action: 'Confirm Screen',
        location: MetaMetricsEventLocation.SignatureConfirmation,
        signature_type: currentConfirmation?.type,
      },
    });
  }

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
            color={IconColor.iconDefault}
            iconName={IconName.Info}
            data-testid="header-info-button"
            size={ButtonIconSize.Md}
            onClick={() => {
              trackAccountModalOpened();
              setShowAccountInfo(true);
            }}
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
            <Box
              display={Display.Flex}
              justifyContent={JustifyContent.center}
              style={{ position: 'relative' }}
            >
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
                <Text
                  fontWeight={FontWeight.Bold}
                  variant={TextVariant.bodyMd}
                  color={TextColor.textDefault}
                  marginTop={2}
                >
                  {fromName}
                </Text>
              </Box>
              <Box style={{ position: 'absolute', right: 0 }}>
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
              <ConfirmInfoRowCurrency
                value={balanceToUse ?? 0}
                dataTestId="header-balance"
              />
            </ConfirmInfoRow>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default HeaderInfo;
