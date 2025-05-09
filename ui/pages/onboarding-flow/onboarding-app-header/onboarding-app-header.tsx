import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import MetaFoxLogo from '../../../components/ui/metafox-logo';
import Dropdown from '../../../components/ui/dropdown';
import { getCurrentLocale } from '../../../ducks/locale/locale';
import { updateCurrentLocale } from '../../../store/actions';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import locales from '../../../../app/_locales/index.json';
import { ONBOARDING_WELCOME_ROUTE } from '../../../helpers/constants/routes';

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
    <div
      className={`onboarding-app-header ${
        pathname === ONBOARDING_WELCOME_ROUTE
          ? 'onboarding-app-header--welcome'
          : ''
      }`}
    >
      <div
        className="onboarding-app-header__contents"
        data-theme={pathname === ONBOARDING_WELCOME_ROUTE ? 'light' : ''}
      >
        <MetaFoxLogo
          theme={pathname === ONBOARDING_WELCOME_ROUTE ? 'light' : undefined}
          unsetIconHeight
          isOnboarding
        />
        <Dropdown
          data-testid="select-locale"
          className={`onboarding-app-header__dropdown ${
            pathname === ONBOARDING_WELCOME_ROUTE
              ? 'onboarding-app-header__dropdown--welcome'
              : ''
          }`}
          options={localeOptions}
          selectedOption={currentLocale}
          onChange={async (newLocale) =>
            dispatch(updateCurrentLocale(newLocale))
          }
        />
      </div>
    </div>
  );
}
