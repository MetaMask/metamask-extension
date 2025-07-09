import React, { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';

import {
  Box,
  Button,
  ButtonIcon,
  ButtonIconSize,
  ButtonSize,
  ButtonVariant,
  IconName,
  Text,
} from '../../../../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  Display,
  FlexDirection,
  FontWeight,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { setSmartAccountOptIn } from '../../../../../store/actions';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { SmartAccountUpdateContent } from '../smart-account-update-content';
import { SmartAccountUpdateSuccess } from './smart-account-update-success';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export function SmartAccountUpdate() {
  const [acknowledged, setAcknowledged] = useState(false);
  const t = useI18nContext();
  const history = useHistory();
  const dispatch = useDispatch();

  const closeAccountUpdatePage = useCallback(() => {
    history.replace('/');
  }, [history]);

  const acknowledgeSmartAccountUpgrade = useCallback(() => {
    dispatch(setSmartAccountOptIn(true));
    setAcknowledged(true);
  }, [setAcknowledged]);

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
        {acknowledged ? (
          <SmartAccountUpdateSuccess />
        ) : (
          <>
            <Box
              display={Display.Flex}
              alignItems={AlignItems.center}
              justifyContent={JustifyContent.center}
              width={BlockSize.Full}
            >
              <ButtonIcon
                iconName={IconName.ArrowLeft}
                onClick={closeAccountUpdatePage}
                size={ButtonIconSize.Sm}
                ariaLabel="back"
                className="smart-account-update__back-btn"
                data-testid="smart-account-update-close"
              />
              <Text
                color={TextColor.textDefault}
                variant={TextVariant.headingSm}
                fontWeight={FontWeight.Bold}
                className="smart-account-update__title"
              >
                {t('smartAccountSplashInfo')}
              </Text>
            </Box>
            <SmartAccountUpdateContent />
            <Button
              marginTop={4}
              onClick={acknowledgeSmartAccountUpgrade}
              size={ButtonSize.Lg}
              variant={ButtonVariant.Primary}
              width={BlockSize.Full}
              className="smart-account-update__update"
            >
              {t('smartAccountAccept')}
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
}
