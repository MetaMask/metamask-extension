import React, { ReactElement, useCallback, useState } from 'react';
import { Hex } from '@metamask/utils';
import { isEvmAccountType } from '@metamask/keyring-api';
import { useSelector } from 'react-redux';

import ZENDESK_URLS from '../../../../../helpers/constants/zendesk-url';
import {
  AvatarAccount,
  AvatarAccountSize,
  AvatarAccountVariant,
  Box,
  Button,
  ButtonLink,
  ButtonLinkSize,
  ButtonSize,
  ButtonVariant,
  Icon,
  IconName,
  Text,
} from '../../../../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderColor,
  Display,
  FlexDirection,
  FontWeight,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { setSmartAccountOptInForAccounts } from '../../../../../store/actions';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { getInternalAccounts, getUseBlockie } from '../../../../../selectors';
import IconButton from '../../../../../components/ui/icon-button/icon-button-round';
import { getSmartAccountOptInForAccounts } from '../../../selectors/preferences';
import { AccountSelection } from '../account-selection';
import { SmartAccountUpdateSuccess } from './smart-account-update-success';

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

export function SmartAccountUpdate({
  wrapped = false,
  handleRejectUpgrade,
}: {
  wrapped?: boolean;
  handleRejectUpgrade?: () => void;
}) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [accountSelectionVisible, setAccountSelectionVisible] = useState(false);
  const t = useI18nContext();
  const useBlockie = useSelector(getUseBlockie);
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

  const acknowledgeSmartAccountUpgrade = useCallback(() => {
    setSmartAccountOptInForAccounts(selectedAccounts);
    setAcknowledged(true);
    setAccountSelectionVisible(false);
  }, [setAcknowledged, selectedAccounts]);

  const showAccountSelectionVisible = useCallback(() => {
    setAccountSelectionVisible(true);
  }, [setAccountSelectionVisible]);

  const hideAccountSelectionVisible = useCallback(() => {
    setAccountSelectionVisible(false);
  }, [setAccountSelectionVisible]);

  if (acknowledged && wrapped) {
    return null;
  }

  return (
    <Box
      display={Display.Flex}
      backgroundColor={BackgroundColor.overlayDefault}
      color={TextColor.primaryDefault}
      className={
        wrapped
          ? 'smart-account-update__container-wrapped'
          : 'smart-account-update__container'
      }
    >
      <Box
        backgroundColor={BackgroundColor.backgroundDefault}
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.spaceBetween}
        padding={4}
        className={
          wrapped
            ? 'smart-account-update__inner-wrapped'
            : 'smart-account-update__inner'
        }
      >
        {accountSelectionVisible && (
          <AccountSelection
            closeAccountSelection={hideAccountSelectionVisible}
            onUpdate={acknowledgeSmartAccountUpgrade}
            selectedAccounts={selectedAccounts}
            setSelectedAccounts={setSelectedAccounts}
            wrapped={wrapped}
          />
        )}
        {!accountSelectionVisible && acknowledged && (
          <SmartAccountUpdateSuccess />
        )}
        {!accountSelectionVisible && !acknowledged && (
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
                data-testid="smart-account-update-edit"
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
            {selectedAccounts.length > 0 && (
              <Box
                display={Display.Flex}
                alignItems={AlignItems.center}
                justifyContent={JustifyContent.center}
                width={BlockSize.Full}
              >
                <Text
                  className="smart-account-update__request-for"
                  color={TextColor.textAlternative}
                  marginInlineEnd={2}
                  variant={TextVariant.bodyMd}
                >
                  {t('smartAccountRequestFor')}
                </Text>
                <Box display={Display.Flex}>
                  {selectedAccounts.map((address) => (
                    <AvatarAccount
                      borderColor={BorderColor.transparent}
                      className="smart-account-update__acc-avatar"
                      size={AvatarAccountSize.Sm}
                      address={address}
                      variant={
                        useBlockie
                          ? AvatarAccountVariant.Blockies
                          : AvatarAccountVariant.Jazzicon
                      }
                      marginInlineEnd={2}
                    />
                  ))}
                </Box>
              </Box>
            )}
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
            {wrapped && (
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
            )}
            <Button
              marginTop={wrapped ? 0 : 4}
              onClick={acknowledgeSmartAccountUpgrade}
              size={ButtonSize.Lg}
              variant={ButtonVariant.Primary}
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
