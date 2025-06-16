import React, { ReactElement, useCallback, useMemo, useState } from 'react';
import { Hex } from '@metamask/utils';
import { NameType } from '@metamask/name-controller';
import { TransactionMeta } from '@metamask/transaction-controller';
import { isEvmAccountType } from '@metamask/keyring-api';
import { useSelector } from 'react-redux';

import { ORIGIN_METAMASK } from '../../../../../../../shared/constants/app';
import ZENDESK_URLS from '../../../../../../helpers/constants/zendesk-url';
import {
  Box,
  Button,
  ButtonLink,
  ButtonLinkSize,
  ButtonSize,
  ButtonVariant,
  Icon,
  IconName,
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
import { setSmartAccountOptInForAccounts } from '../../../../../../store/actions';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import IconButton from '../../../../../../components/ui/icon-button/icon-button-round';
import Name from '../../../../../../components/app/name';
import { getInternalAccounts } from '../../../../../../selectors';
import { useConfirmContext } from '../../../../context/confirm';
import { useSmartAccountActions } from '../../../../hooks/useSmartAccountActions';
import { getSmartAccountOptInForAccounts } from '../../../../selectors/preferences';
import { AccountSelection } from '../../account-selection';

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
  const [accountSelectionVisible, setAccountSelectionVisible] = useState(false);
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { handleRejectUpgrade } = useSmartAccountActions();
  const smartAccountOptInForAccounts: Hex[] = useSelector(
    getSmartAccountOptInForAccounts,
  );
  const accounts = useSelector(getInternalAccounts);
  const evmAccounts = accounts.filter((acc) => isEvmAccountType(acc.type));
  const [selectedAccounts, setSelectedAccounts] = useState(() => {
    if (smartAccountOptInForAccounts?.length) {
      return smartAccountOptInForAccounts;
    }
    return (evmAccounts ?? []).map((acc) => acc.address as Hex);
  });

  const { chainId, txParams, origin } = currentConfirmation ?? {};
  const { from } = txParams;

  const acknowledgeSmartAccountUpgrade = useCallback(() => {
    setSmartAccountOptInForAccounts(selectedAccounts);
    setAcknowledged(true);
  }, [setAcknowledged, selectedAccounts, setSmartAccountOptInForAccounts]);

  const showAccountSelectionVisible = useCallback(() => {
    setAccountSelectionVisible(true);
  }, [setAccountSelectionVisible]);

  const hideAccountSelectionVisible = useCallback(() => {
    setAccountSelectionVisible(false);
  }, [setAccountSelectionVisible]);

  if (
    !currentConfirmation ||
    acknowledged ||
    origin === ORIGIN_METAMASK ||
    smartAccountOptInForAccounts?.includes(from.toLowerCase() as Hex)
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
        {accountSelectionVisible ? (
          <AccountSelection
            closeAccountSelection={hideAccountSelectionVisible}
            selectedAccounts={selectedAccounts}
            setSelectedAccounts={setSelectedAccounts}
          />
        ) : (
          <>
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              alignItems={AlignItems.center}
              justifyContent={JustifyContent.spaceBetween}
            >
              <Text
                color={TextColor.textDefault}
                variant={TextVariant.headingMd}
              >
                {t('smartAccountSplashInfo')}
              </Text>
              <IconButton
                Icon={<Icon name={IconName.Edit} />}
                onClick={showAccountSelectionVisible}
                label=""
                className="smart-account-update__edit"
              />
            </Box>
            <img
              width="80%"
              src="./images/smart-transactions/smart-account-update.svg"
            />
            <Text
              fontWeight={FontWeight.Medium}
              variant={TextVariant.headingLg}
            >
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
          </>
        )}
      </Box>
    </Box>
  );
}
