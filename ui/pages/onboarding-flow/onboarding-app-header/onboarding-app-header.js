import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import MetaFoxLogo from '../../../components/ui/metafox-logo';
import Dropdown from '../../../components/ui/dropdown';
import { getCurrentLocale } from '../../../ducks/locale/locale';
import { updateCurrentLocale } from '../../../store/actions';
import locales from '../../../../app/_locales/index.json';

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
