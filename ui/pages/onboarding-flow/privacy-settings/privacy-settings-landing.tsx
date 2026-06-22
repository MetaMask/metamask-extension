import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  ButtonIcon,
  ButtonIconSize,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';
import { useI18nContext } from '../../../hooks/useI18nContext';
import type { PrivacySettingsView } from './privacy-settings.types';

const LANDING_ITEMS: {
  id: PrivacySettingsView;
  iconName: IconName;
  labelKey: string;
  testId: string;
}[] = [
  {
    id: 'privacy',
    iconName: IconName.Lock,
    labelKey: 'privacy',
    testId: 'onboarding-privacy-settings-item-privacy',
  },
  {
    id: 'backup-and-sync',
    iconName: IconName.SecurityTime,
    labelKey: 'backupAndSync',
    testId: 'onboarding-privacy-settings-item-backup-and-sync',
  },
  {
    id: 'network-rpc',
    iconName: IconName.Hierarchy,
    labelKey: 'onboardingNetworkRpcNavLabel',
    testId: 'onboarding-privacy-settings-item-network-rpc',
  },
];

type PrivacySettingsLandingProps = {
  onSelectView: (view: PrivacySettingsView) => void;
  onComplete: () => void;
};

export const PrivacySettingsLanding = ({
  onSelectView,
  onComplete,
}: PrivacySettingsLandingProps) => {
  const t = useI18nContext();

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      className="w-full"
      data-testid="privacy-settings-landing"
    >
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
        alignItems={BoxAlignItems.Center}
        paddingHorizontal={4}
        paddingTop={4}
      >
        <ButtonIcon
          iconName={IconName.ArrowLeft}
          ariaLabel={t('back')}
          size={ButtonIconSize.Lg}
          data-testid="privacy-settings-back-button"
          onClick={onComplete}
        />
      </Box>

      <Box paddingHorizontal={4} paddingTop={5} paddingBottom={4}>
        <Text variant={TextVariant.HeadingMd} fontWeight={FontWeight.Bold}>
          {t('defaultSettingsTitle')}
        </Text>
        <Text
          variant={TextVariant.BodyMd}
          color={TextColor.TextAlternative}
          className="mt-5"
        >
          {t('defaultSettingsSubTitle')}{' '}
          <a
            href={ZENDESK_URLS.PRIVACY_BEST_PRACTICES}
            target="_blank"
            rel="noreferrer"
          >
            {t('learnMoreAboutPrivacy')}
          </a>
        </Text>
      </Box>

      <Box flexDirection={BoxFlexDirection.Column} className="w-full">
        {LANDING_ITEMS.map(({ id, iconName, labelKey, testId }) => (
          <button
            key={id}
            type="button"
            className="w-full border-0 bg-transparent p-0 text-left text-inherit cursor-pointer hover:bg-background-default-hover"
            onClick={() => onSelectView(id)}
            data-testid={testId}
          >
            <Box
              flexDirection={BoxFlexDirection.Row}
              alignItems={BoxAlignItems.Center}
              className="w-full gap-2 px-4 py-3"
            >
              <Icon
                name={iconName}
                size={IconSize.Md}
                color={IconColor.IconAlternative}
              />
              <Text
                variant={TextVariant.BodyMd}
                fontWeight={FontWeight.Medium}
                className="flex-1 min-w-0 text-left"
              >
                {t(labelKey)}
              </Text>
              <Icon
                name={IconName.ArrowRight}
                size={IconSize.Sm}
                color={IconColor.IconAlternative}
              />
            </Box>
          </button>
        ))}
      </Box>
    </Box>
  );
};
