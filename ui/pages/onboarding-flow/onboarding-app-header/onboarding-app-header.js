import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import classnames from 'classnames';
import MetaFoxLogo from '../../../components/ui/metafox-logo';
import Dropdown from '../../../components/ui/dropdown';
import { getCurrentLocale } from '../../../ducks/locale/locale';
import { updateCurrentLocale } from '../../../store/actions';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import locales from '../../../../app/_locales/index.json';
import { ONBOARDING_WELCOME_ROUTE } from '../../../helpers/constants/routes';
import { Box } from '../../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  Display,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import { ThemeType } from '../../../../shared/constants/preferences';

export default function OnboardingAppHeader() {
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const currentLocale = useSelector(getCurrentLocale);
  const localeOptions = locales.map((locale) => {
    return {
      name: locale.name,
      value: locale.code,
    };
  });

  return (
    <Box
      display={Display.Flex}
      alignItems={AlignItems.center}
      backgroundColor={BackgroundColor.backgroundDefault}
      width={BlockSize.Full}
      padding={4}
      className={classnames('onboarding-app-header', {
        'onboarding-app-header--welcome': pathname === ONBOARDING_WELCOME_ROUTE,
      })}
    >
      <Box
        display={Display.Flex}
        width={BlockSize.Full}
        justifyContent={JustifyContent.spaceBetween}
        className="onboarding-app-header__contents"
      >
        <MetaFoxLogo
          theme={
            pathname === ONBOARDING_WELCOME_ROUTE ? ThemeType.light : undefined
          }
          unsetIconHeight
          isOnboarding
        />
        <Dropdown
          data-testid="select-locale"
          className={classnames(
            'onboarding-app-header__dropdown onboarding-app-header__dropdown--welcome--login',
          )}
          options={localeOptions}
          selectedOption={currentLocale}
          onChange={async (newLocale) =>
            dispatch(updateCurrentLocale(newLocale))
          }
        />
      </Box>
    </Box>
  );
}
