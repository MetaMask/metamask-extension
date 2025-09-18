import React from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import classnames from 'classnames';
import Dropdown from '../../../components/ui/dropdown';
import { getCurrentLocale } from '../../../ducks/locale/locale';
import { updateCurrentLocale } from '../../../store/actions';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import locales from '../../../../app/_locales/index.json';
import { Box } from '../../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  Display,
  JustifyContent,
} from '../../../helpers/constants/design-system';

export default function OnboardingAppHeader({ isWelcomePage }) {
  const dispatch = useDispatch();
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
      alignItems={AlignItems.flexEnd}
      backgroundColor={BackgroundColor.backgroundDefault}
      width={BlockSize.Full}
      paddingTop={8}
      paddingBottom={4}
      className={classnames('onboarding-app-header', {
        'onboarding-app-header--welcome': isWelcomePage,
      })}
    >
      <Box
        display={Display.Flex}
        width={BlockSize.Full}
        justifyContent={JustifyContent.flexEnd}
        className="onboarding-app-header__contents"
      >
        <Dropdown
          data-testid="select-locale"
          className={classnames('onboarding-app-header__dropdown', {
            'onboarding-app-header__dropdown--welcome--login': isWelcomePage,
          })}
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

OnboardingAppHeader.propTypes = {
  isWelcomePage: PropTypes.bool,
};
