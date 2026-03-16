import React, { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { Location as RouterLocation } from 'react-router-dom';
import classnames from 'clsx';
import {
  Box,
  BoxJustifyContent,
  BoxBackgroundColor,
  Text,
  TextColor,
  TextVariant,
  Icon,
  IconName,
  IconColor,
  IconSize,
  BoxFlexDirection,
} from '@metamask/design-system-react';
import {
  BackgroundColor,
  BorderColor,
} from '../../../helpers/constants/design-system';
import MetaFoxLogo from '../../../components/ui/metafox-logo';
import { useI18nContext } from '../../../hooks/useI18nContext';
import Dropdown from '../../../components/ui/dropdown';
import { getCurrentLocale } from '../../../ducks/locale/locale';
import { updateCurrentLocale } from '../../../store/actions';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import locales from '../../../../app/_locales/index.json';
import { BannerTip } from '../../../components/component-library';
import {
  ONBOARDING_COMPLETION_ROUTE,
  ONBOARDING_WELCOME_ROUTE,
} from '../../../helpers/constants/routes';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_SIDEPANEL } from '../../../../shared/constants/app';

type OnboardingAppHeaderProps = {
  isWelcomePage: boolean;
  location: RouterLocation;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function OnboardingAppHeader({
  isWelcomePage = false,
  location,
}: OnboardingAppHeaderProps) {
  const dispatch = useDispatch();
  const { pathname, search } = location;
  const t = useI18nContext();
  const currentLocale = useSelector(getCurrentLocale);
  const localeOptions = locales.map((locale) => {
    return {
      name: locale.name,
      value: locale.code,
    };
  });

  const searchParams = new URLSearchParams(search);
  const isFromReminder = searchParams.get('isFromReminder');
  const isFromSettingsSecurity = searchParams.get('isFromSettingsSecurity');
  const isFromSettingsSRPBackup = isFromReminder || isFromSettingsSecurity;

  // We don't wanna show the logo and locale dropdown in the sidepanel view
  const showLogoAndLocaleDropdown = useMemo(() => {
    const windowType = getEnvironmentType();
    return windowType !== ENVIRONMENT_TYPE_SIDEPANEL;
  }, []);

  return (
    <Box
      backgroundColor={BoxBackgroundColor.BackgroundDefault}
      padding={4}
      className={classnames('onboarding-app-header w-full', {
        'onboarding-app-header--welcome': isWelcomePage,
      })}
    >
      {showLogoAndLocaleDropdown ? (
        <Box
          flexDirection={BoxFlexDirection.Row}
          justifyContent={
            pathname === ONBOARDING_WELCOME_ROUTE
              ? BoxJustifyContent.End
              : BoxJustifyContent.Between
          }
          className="onboarding-app-header__contents w-full mx-auto"
        >
          {pathname !== ONBOARDING_WELCOME_ROUTE && (
            <MetaFoxLogo unsetIconHeight isOnboarding />
          )}

          {pathname === ONBOARDING_COMPLETION_ROUTE &&
          !isFromSettingsSRPBackup ? (
            <Box
              paddingTop={12}
              className="onboarding-app-header__banner-tip-container"
            >
              <BannerTip
                borderColor={BorderColor.borderMuted}
                backgroundColor={BackgroundColor.backgroundMuted}
                title={t('pinMetaMask')}
                className="onboarding-app-header__banner-tip"
                padding={3}
              >
                <Text
                  variant={TextVariant.BodySm}
                  color={TextColor.TextAlternative}
                  className="flex items-center pr-2"
                >
                  {t('pinMetaMaskDescription', [
                    <Icon
                      name={IconName.Extension}
                      key="extension"
                      color={IconColor.IconDefault}
                      size={IconSize.Md}
                      className="onboarding-app-header__banner-tip-icon"
                    />,
                    <Icon
                      name={IconName.Keep}
                      key="keep"
                      color={IconColor.IconDefault}
                      size={IconSize.Md}
                      className="onboarding-app-header__banner-tip-icon"
                    />,
                  ])}
                </Text>
              </BannerTip>
            </Box>
          ) : (
            <Dropdown
              data-testid="select-locale"
              className={classnames('onboarding-app-header__dropdown', {
                'onboarding-app-header__dropdown--welcome--login':
                  isWelcomePage,
              })}
              options={localeOptions}
              selectedOption={currentLocale}
              onChange={async (newLocale) =>
                dispatch(updateCurrentLocale(newLocale))
              }
            />
          )}
        </Box>
      ) : (
        <></>
      )}
    </Box>
  );
}
