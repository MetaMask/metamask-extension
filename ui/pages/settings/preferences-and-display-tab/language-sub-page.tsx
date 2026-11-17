import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  ContentVariant,
  Icon,
  IconName,
  IconSize,
  IconColor,
  ListItem,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { updateCurrentLocale } from '../../../store/actions';
import { useI18nContext } from '../../../hooks/useI18nContext';
// TODO: Remove restricted import
// eslint-disable-next-line import-x/no-restricted-paths
import locales from '../../../../app/_locales/index.json';
import { isMaintainedLocale } from '../../../../shared/constants/locales';
import type { MetaMaskReduxState } from '../../../store/store';
import { Divider } from '../shared';
import { transitionBack } from '../../../components/ui/transition';
import { useDispatch } from '../../../store/hooks';

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
    transitionBack(() => navigate(-1));
  };

  const renderLocaleRows = (entries: LocaleEntry[]) =>
    entries.map(({ code: value, name: label }) => {
      const isSelected = value === currentLocale;
      return (
        <ListItem
          key={value}
          variant={ContentVariant.OneLine}
          isInteractive
          onClick={() => handleSelect(value)}
          className={
            isSelected
              ? 'bg-muted hover:bg-muted-hover'
              : 'bg-background-default hover:bg-background-default-hover'
          }
          data-testid={`locale-option-${value}`}
          title={label}
          endAccessory={
            isSelected ? (
              <Icon
                name={IconName.Check}
                size={IconSize.Md}
                color={IconColor.IconDefault}
              />
            ) : undefined
          }
        />
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
