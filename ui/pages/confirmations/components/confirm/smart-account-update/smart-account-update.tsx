import React, { useCallback, useState } from 'react';
import { Hex } from '@metamask/utils';
import { useSelector } from 'react-redux';

import {
  Box,
  Button,
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
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { setSmartAccountOptInForAccounts } from '../../../../../store/actions';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import IconButton from '../../../../../components/ui/icon-button/icon-button-round';
import { getSmartAccountOptInForAccounts } from '../../../selectors/preferences';
import { AccountSelection } from '../account-selection';
import { SmartAccountUpdateContent } from '../smart-account-update-content/smart-account-update-content';
import { SmartAccountUpdateSuccess } from './smart-account-update-success';
import { useHistory } from 'react-router-dom';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export function SmartAccountUpdate() {
  const [acknowledged, setAcknowledged] = useState(false);
  const [accountSelectionVisible, setAccountSelectionVisible] = useState(false);
  const t = useI18nContext();
  const history = useHistory();
  const smartAccountOptInForAccounts: Hex[] = useSelector(
    getSmartAccountOptInForAccounts,
  );
  const [selectedAccounts, setSelectedAccounts] = useState(() => {
    return smartAccountOptInForAccounts;
  });

  const closeAccountUpdatePage = useCallback(() => {
    history.replace('/');
  }, [history]);

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

  return (
    <Box
      backgroundColor={BackgroundColor.backgroundDefault}
      display={Display.Flex}
      justifyContent={JustifyContent.center}
      className="smart-account-update__container"
    >
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.spaceBetween}
        className="smart-account-update__inner"
        padding={4}
      >
        {accountSelectionVisible && (
          <AccountSelection
            closeAccountSelection={hideAccountSelectionVisible}
            onUpdate={acknowledgeSmartAccountUpgrade}
            selectedAccounts={selectedAccounts}
            setSelectedAccounts={setSelectedAccounts}
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
              <IconButton
                Icon={<Icon name={IconName.ArrowLeft} />}
                onClick={closeAccountUpdatePage}
                className="smart-account-update__close-left"
                label=""
                data-testid="smart-account-update-close"
              />
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
            <SmartAccountUpdateContent selectedAddresses={selectedAccounts} />
            <Button
              marginTop={4}
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
