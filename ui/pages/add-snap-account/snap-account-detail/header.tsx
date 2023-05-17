import React from 'react';
import Box from '../../../components/ui/box/box';
import {
  AlignItems,
  DISPLAY,
  FLEX_DIRECTION,
  JustifyContent,
  TextVariant,
} from '../../../helpers/constants/design-system';
import Identicon from '../../../components/ui/identicon';
import {
  Text,
  Button,
  Tag,
  BUTTON_VARIANT,
} from '../../../components/component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { SnapCardProps } from '../snap-account/snap-account';

export const SnapDetailHeader = ({
  updateAvailable,
  snapTitle,
  isInstalled,
  iconUrl,
  developer,
  auditUrls,
}: Pick<
  SnapCardProps,
  | 'updateAvailable'
  | 'snapTitle'
  | 'isInstalled'
  | 'iconUrl'
  | 'developer'
  | 'auditUrls'
>) => {
  const t = useI18nContext();

  return (
    <Box marginBottom={5}>
      <Box justifyContent={JustifyContent.spaceBetween}>
        <Text variant={TextVariant.headingLg}>{snapTitle}</Text>
        <Box>
          {isInstalled && updateAvailable && (
            <Button variant={BUTTON_VARIANT.PRIMARY} marginRight={1}>
              {t('snapUpdateAvailable')}
            </Button>
          )}
          {isInstalled && (
            <Button variant={BUTTON_VARIANT.PRIMARY}>
              {t('snapConfigure')}
            </Button>
          )}
          {!isInstalled && (
            <Button variant={BUTTON_VARIANT.PRIMARY}>{t('snapInstall')}</Button>
          )}
        </Box>
      </Box>
      <Box
        display={DISPLAY.FLEX}
        flexDirection={FLEX_DIRECTION.ROW}
        alignItems={AlignItems.center}
      >
        <Identicon image={iconUrl} />
        {developer === 'Metamask' && (
          <Tag
            label={t('snapCreatedByMetaMask')}
            labelProps={{}}
            className=""
            marginRight={1}
          />
        )}
        {auditUrls.length > 0 && (
          <Tag label={t('snapIsAudited')} labelProps={{}} className="" />
        )}
      </Box>
    </Box>
  );
};
