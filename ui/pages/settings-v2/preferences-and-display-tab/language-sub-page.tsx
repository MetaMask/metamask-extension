import React, { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
  FontWeight,
  Icon,
  IconName,
  IconSize,
  IconColor,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { updateCurrentLocale } from '../../../store/actions';
import { PREFERENCES_AND_DISPLAY_ROUTE } from '../../../helpers/constants/routes';
import { useI18nContext } from '../../../hooks/useI18nContext';
// TODO: Remove restricted import
// eslint-disable-next-line import-x/no-restricted-paths
import locales from '../../../../app/_locales/index.json';
import { isMaintainedLocale } from '../../../../shared/constants/locales';
import type { MetaMaskReduxState } from '../../../store/store';
import { Divider } from '../shared';

type LocaleEntry = (typeof locales)[number];

const LanguageSubPage = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentLocale = useSelector(
    (state: MetaMaskReduxState) => state.metamask.currentLocale,
  );

  const { supportedLocales, communityLocales } = useMemo(() => {
    const supported: LocaleEntry[] = [];
    const community: LocaleEntry[] = [];
    for (const locale of locales) {
      if (isMaintainedLocale(locale.code)) {
        supported.push(locale);
      } else {
        community.push(locale);
      }
    }
    return { supportedLocales: supported, communityLocales: community };
  }, []);

  const handleSelect = (value: string) => {
    dispatch(updateCurrentLocale(value));
    navigate(PREFERENCES_AND_DISPLAY_ROUTE);
  };

  const renderLocaleRows = (entries: LocaleEntry[]) =>
    entries.map(({ code: value, name: label }) => {
      const isSelected = value === currentLocale;
      return (
        <Box
          key={value}
          data-testid={`locale-option-${value}`}
          flexDirection={BoxFlexDirection.Row}
          justifyContent={BoxJustifyContent.Between}
          alignItems={BoxAlignItems.Center}
          className={`w-full cursor-pointer border-0 p-4 ${
            isSelected
              ? 'bg-muted hover:bg-muted-hover'
              : 'bg-background-default hover:bg-background-default-hover'
          }`}
          onClick={() => handleSelect(value)}
        >
          <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
            {label}
          </Text>
          {isSelected && (
            <Icon
              name={IconName.Check}
              size={IconSize.Md}
              color={IconColor.IconDefault}
            />
          )}
        </Box>
      );
    });

  return (
    <Box data-testid="locale-select-list" className="overflow-y-auto">
      <Text
        variant={TextVariant.BodyMd}
        color={TextColor.TextAlternative}
        className="px-4 pt-3 pb-2"
        data-testid="supported-languages-section-heading"
      >
        {t('supportedLanguagesSectionTitle')}
      </Text>
      {renderLocaleRows(supportedLocales)}
      <Divider />
      <Text
        variant={TextVariant.BodyMd}
        color={TextColor.TextAlternative}
        className="px-4 pt-3 pb-2"
        data-testid="community-languages-section-heading"
      >
        {t('communityContributedLanguagesSectionTitle')}
      </Text>
      {renderLocaleRows(communityLocales)}
    </Box>
  );
};

export default LanguageSubPage;
