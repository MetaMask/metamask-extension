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
import { useConfirmContext } from '../../../context/confirm';
import { useBalance } from '../../../hooks/useBalance';
import useConfirmationRecipientInfo from '../../../hooks/useConfirmationRecipientInfo';
import { SignatureRequestType } from '../../../types/confirm';
import { isSignatureTransactionType } from '../../../utils/confirm';
import { isCorrectDeveloperTransactionType } from '../../../../../../shared/lib/confirmation.utils';
import Identicon from '../../../../../components/ui/identicon';
import { getHDEntropyIndex } from '../../../../../selectors/selectors';
import { AdvancedDetailsButton } from './advanced-details-button';

const HeaderInfo = () => {
  const { trackEvent } = useContext(MetaMetricsContext);
  const hdEntropyIndex = useSelector(getHDEntropyIndex);

  const [showAccountInfo, setShowAccountInfo] = React.useState(false);

  const { currentConfirmation } = useConfirmContext();

  const { senderAddress: fromAddress, senderName: fromName } =
    useConfirmationRecipientInfo();

  const t = useI18nContext();

  const { balance: balanceToUse } = useBalance(fromAddress);

  const isSignature = isSignatureTransactionType(currentConfirmation);

  const eventProps = isSignature
    ? {
        location: MetaMetricsEventLocation.SignatureConfirmation,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        signature_type: (currentConfirmation as SignatureRequestType)?.msgParams
          ?.signatureMethod,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        hd_entropy_index: hdEntropyIndex,
      }
    : {
        location: MetaMetricsEventLocation.Transaction,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        transaction_type: currentConfirmation?.type,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        hd_entropy_index: hdEntropyIndex,
      };

  function trackAccountModalOpened() {
    const event = {
      category: MetaMetricsEventCategory.Confirmations,
      event: MetaMetricsEventName.AccountDetailsOpened,
      properties: {
        action: 'Confirm Screen',
        ...eventProps,
      },
    };

    trackEvent(event);
  }

  const isShowAdvancedDetailsToggle = isCorrectDeveloperTransactionType(
    currentConfirmation?.type,
  );

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
            size={ButtonIconSize.Md}
            onClick={() => {
              trackAccountModalOpened();
              setShowAccountInfo(true);
            }}
            data-testid="header-info__account-details-button"
          />
        </Tooltip>
        {isShowAdvancedDetailsToggle && <AdvancedDetailsButton />}
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
                <Identicon address={fromAddress} diameter={40} />
                <Text
                  fontWeight={FontWeight.Bold}
                  variant={TextVariant.bodyMd}
                  color={TextColor.textDefault}
                  marginTop={2}
                  data-testid={
                    'confirmation-account-details-modal__account-name'
                  }
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
                  data-testid="confirmation-account-details-modal__close-button"
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
                data-testid="confirmation-account-details-modal__account-balance"
              />
            </ConfirmInfoRow>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default HeaderInfo;
