import React, { ReactElement, useCallback, useState } from 'react';
import { NameType } from '@metamask/name-controller';
import { TransactionMeta } from '@metamask/transaction-controller';
import { useDispatch, useSelector } from 'react-redux';

import { ORIGIN_METAMASK } from '../../../../../../../shared/constants/app';
import ZENDESK_URLS from '../../../../../../helpers/constants/zendesk-url';
import {
  Box,
  Button,
  ButtonLink,
  ButtonLinkSize,
  ButtonSize,
  ButtonVariant,
  Text,
} from '../../../../../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderRadius,
  Display,
  FlexDirection,
  FontWeight,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../../../helpers/constants/design-system';
import {
  setSmartAccountOptIn,
  setSplashPageAcknowledgedForAccount,
} from '../../../../../../store/actions';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import Name from '../../../../../../components/app/name';
import {
  AccountsState,
  getMemoizedInternalAccountByAddress,
} from '../../../../../../selectors';
import { isHardwareKeyring } from '../../../../../../helpers/utils/hardware';
import { getUpgradeSplashPageAcknowledgedForAccounts } from '../../../../selectors';
import { getUseSmartAccount } from '../../../../selectors/preferences';
import { useConfirmContext } from '../../../../context/confirm';
import { useSmartAccountActions } from '../../../../hooks/useSmartAccountActions';

const ListItem = ({
  imgSrc,
  title,
  description,
}: {
  imgSrc: string;
  title: string;
  description: ReactElement;
}) => (
  <Box display={Display.Flex} alignItems={AlignItems.flexStart}>
    <img width="24px" src={imgSrc} />
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      marginInlineStart={2}
    >
      <Text
        color={TextColor.textDefault}
        variant={TextVariant.bodyMd}
        fontWeight={FontWeight.Medium}
      >
        {title}
      </Text>
      <Text
        color={TextColor.textAlternative}
        variant={TextVariant.bodyMd}
        fontWeight={FontWeight.Normal}
      >
        {description}
      </Text>
    </Box>
  </Box>
);

export function SmartAccountUpdate() {
  const [acknowledged, setAcknowledged] = useState(false);
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { handleRejectUpgrade } = useSmartAccountActions();
  const splashPageAcknowledgedForAccountList: string[] = useSelector(
    getUpgradeSplashPageAcknowledgedForAccounts,
  );
  const smartAccountOptIn = useSelector(getUseSmartAccount);
  const { chainId, txParams, origin } = currentConfirmation ?? {};
  const { from } = txParams;
  const account = useSelector((state: AccountsState) =>
    getMemoizedInternalAccountByAddress(state as AccountsState, from),
  );
  const keyringType = account?.metadata?.keyring?.type;

  const acknowledgeSmartAccountUpgrade = useCallback(() => {
    setSplashPageAcknowledgedForAccount(from);
    setAcknowledged(true);
    dispatch(setSmartAccountOptIn(true));
  }, [from, setAcknowledged]);

  if (
    !currentConfirmation ||
    acknowledged ||
    origin === ORIGIN_METAMASK ||
    splashPageAcknowledgedForAccountList.includes(from.toLowerCase()) ||
    (smartAccountOptIn && !isHardwareKeyring(keyringType))
  ) {
    return null;
  }

  return (
    <Box
      display={Display.Flex}
      backgroundColor={BackgroundColor.overlayDefault}
      color={TextColor.primaryDefault}
      className="smart-account-update__wrapper"
    >
      <Box
        backgroundColor={BackgroundColor.backgroundDefault}
        borderRadius={BorderRadius.MD}
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.spaceBetween}
        margin={4}
        padding={4}
        className="smart-account-update__inner"
      >
        <img
          width="100%"
          src="./images/smart-transactions/smart-account-update.svg"
        />
        <Text fontWeight={FontWeight.Medium} variant={TextVariant.headingLg}>
          {t('smartAccountSplashTitle')}
        </Text>
        <Box display={Display.Flex} alignItems={AlignItems.center}>
          <Text
            color={TextColor.textAlternative}
            variant={TextVariant.bodyMd}
            marginInlineEnd={2}
          >
            {t('smartAccountRequestFor')}
          </Text>
          <Name
            value={from}
            type={NameType.ETHEREUM_ADDRESS}
            preferContractSymbol
            variation={chainId}
          />
        </Box>
        <ListItem
          imgSrc="./images/speedometer.svg"
          title={t('smartAccountBetterTransaction')}
          description={t('smartAccountBetterTransactionDescription')}
        />
        <ListItem
          imgSrc="./images/petrol-pump.svg"
          title={t('smartAccountPayToken')}
          description={t('smartAccountPayTokenDescription')}
        />
        <ListItem
          imgSrc="./images/sparkle.svg"
          title={t('smartAccountSameAccount')}
          description={
            <>
              <Text
                color={TextColor.textAlternative}
                variant={TextVariant.bodyMd}
                fontWeight={FontWeight.Normal}
              >
                {t('smartAccountFeaturesDescription')}{' '}
                <ButtonLink
                  size={ButtonLinkSize.Inherit}
                  href={ZENDESK_URLS.ACCOUNT_UPGRADE}
                  externalLink
                >
                  {t('learnMoreUpperCaseWithDot')}
                </ButtonLink>
              </Text>
            </>
          }
        />
        <Button
          variant={ButtonVariant.Secondary}
          size={ButtonSize.Lg}
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onClick={handleRejectUpgrade}
          width={BlockSize.Full}
        >
          {t('smartAccountReject')}
        </Button>
        <Button
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          onClick={acknowledgeSmartAccountUpgrade}
          width={BlockSize.Full}
        >
          {t('smartAccountAccept')}
        </Button>
      </Box>
    </Box>
  );
}
