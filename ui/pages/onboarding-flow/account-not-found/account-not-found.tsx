import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Button,
  ButtonSize,
  ButtonVariant,
} from '../../../components/component-library/button';
import {
  TextVariant,
  Display,
  AlignItems,
  JustifyContent,
  FlexDirection,
  BlockSize,
  IconColor,
} from '../../../helpers/constants/design-system';
import {
  Box,
  Text,
  IconName,
  ButtonIcon,
  ButtonIconSize,
} from '../../../components/component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  ONBOARDING_CREATE_PASSWORD_ROUTE,
  ONBOARDING_WELCOME_ROUTE,
} from '../../../helpers/constants/routes';

import { getFirstTimeFlowType, getSocialLoginEmail } from '../../../selectors';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import { resetOAuthLoginState } from '../../../store/actions';

export default function AccountNotFound() {
  const history = useHistory();
  const dispatch = useDispatch();
  const t = useI18nContext();
  const firstTimeFlowType = useSelector(getFirstTimeFlowType);
  const userSocialLoginEmail = useSelector(getSocialLoginEmail);

  const onCreateOne = async () => {
    history.push(ONBOARDING_CREATE_PASSWORD_ROUTE);
  };

  const onLoginWithDifferentMethod = async () => {
    // clear the social login state
    await dispatch(resetOAuthLoginState());
    history.push(ONBOARDING_WELCOME_ROUTE);
  };

  useEffect(() => {
    if (firstTimeFlowType !== FirstTimeFlowType.social) {
      // if the onboarding flow is not seedless, redirect to the welcome page
      history.push(ONBOARDING_WELCOME_ROUTE);
    }
  }, [firstTimeFlowType, history]);

  return (
    <Box
      className="account-not-found"
      data-testid="account-not-found"
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
    >
      <div className="account-not-found__content">
        <Box
          justifyContent={JustifyContent.flexStart}
          marginBottom={4}
          width={BlockSize.Full}
        >
          <ButtonIcon
            iconName={IconName.ArrowLeft}
            color={IconColor.iconDefault}
            size={ButtonIconSize.Md}
            data-testid="create-password-back-button"
            onClick={() => history.goBack()}
            ariaLabel="back"
          />
        </Box>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          justifyContent={JustifyContent.center}
          alignItems={AlignItems.flexStart}
        >
          <Text
            variant={TextVariant.headingLg}
            as="h2"
            justifyContent={JustifyContent.center}
            style={{
              alignSelf: AlignItems.flexStart,
            }}
            marginBottom={4}
          >
            {t('accountNotFoundTitle')}
          </Text>
          <Box
            width={BlockSize.Full}
            display={Display.Flex}
            justifyContent={JustifyContent.center}
            alignItems={AlignItems.center}
            marginBottom={6}
          >
            <img
              src="images/account-status.png"
              width={276}
              height={276}
              alt="Account already exists"
            />
          </Box>
          <Text variant={TextVariant.bodyMd} marginBottom={6}>
            {t('accountNotFoundDescription', [userSocialLoginEmail])}
          </Text>
        </Box>
      </div>

      <Box
        className="account-not-found__actions"
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        justifyContent={JustifyContent.center}
        alignItems={AlignItems.center}
        width={BlockSize.Full}
        gap={2}
      >
        <Button
          data-testid="onboarding-complete-done"
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          width={BlockSize.Full}
          onClick={onCreateOne}
        >
          {t('accountNotFoundCreateOne')}
        </Button>
        <Button
          data-testid="account-not-found-login-with-different-method"
          variant={ButtonVariant.Secondary}
          size={ButtonSize.Lg}
          width={BlockSize.Full}
          onClick={onLoginWithDifferentMethod}
        >
          {t('useDifferentLoginMethod')}
        </Button>
      </Box>
    </Box>
  );
}
