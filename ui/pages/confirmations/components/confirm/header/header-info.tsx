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
import {
  getCurrentNetwork,
  getSelectedAccountCachedBalance,
  getShouldHideZeroBalanceTokens,
  getShowFiatInTestnets,
  getUseBlockie,
} from '../../../../../selectors';
import { useAccountTotalFiatBalance } from '../../../../../hooks/useAccountTotalFiatBalance';
import { TEST_NETWORKS } from '../../../../../../shared/constants/network';
import { ConfirmInfoRowCurrency } from '../../../../../components/app/confirm/info/row/currency';

const HeaderInfo = () => {
  const useBlockie = useSelector(getUseBlockie);
  const [showAccountInfo, setShowAccountInfo] = React.useState(false);
  const { recipientAddress: fromAddress, recipientName: fromName } =
    useConfirmationRecipientInfo();

  const t = useI18nContext();

  const shouldHideZeroBalanceTokens = useSelector(
    getShouldHideZeroBalanceTokens,
  );

  const { totalWeiBalance } = useAccountTotalFiatBalance(
    fromAddress,
    shouldHideZeroBalanceTokens,
  );

  const currentNetwork = useSelector(getCurrentNetwork);

  const showFiatInTestnets = useSelector(getShowFiatInTestnets);
  const showFiat =
    TEST_NETWORKS.includes(currentNetwork?.nickname) && !showFiatInTestnets;

  let balanceToUse = totalWeiBalance;

  const balance = useSelector(getSelectedAccountCachedBalance);

  if (showFiat) {
    balanceToUse = balance;
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
              <ConfirmInfoRowCurrency value={balanceToUse} />
            </ConfirmInfoRow>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default HeaderInfo;
