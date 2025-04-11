import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import locales from '../../../../app/_locales/index.json';
import Dropdown from '../../../components/ui/dropdown';
import MetaFoxLogo from '../../../components/ui/metafox-logo';
import { getCurrentLocale } from '../../../ducks/locale/locale';
import { updateCurrentLocale } from '../../../store/actions';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths

export default function OnboardingAppHeader() {
  const dispatch = useDispatch();
  const currentLocale = useSelector(getCurrentLocale);
  const localeOptions = locales.map((locale) => {
    return {
      name: locale.name,
      value: locale.code,
    };
  });

  return (
    <div className="onboarding-app-header">
      <div className="onboarding-app-header__contents">
        <MetaFoxLogo unsetIconHeight isOnboarding />
        <Dropdown
          id="select-locale"
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
