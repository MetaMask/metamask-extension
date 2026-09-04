import React, { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import classnames from 'clsx';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  BoxJustifyContent,
  ButtonIcon,
  ButtonIconSize,
  FontWeight,
  IconColor,
  IconName,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  ONBOARDING_REVIEW_SRP_ROUTE,
  REVEAL_SEED_ROUTE,
} from '../../../helpers/constants/routes';

export type MultichainSrpBackupProps = {
  shouldShowBackupReminder?: boolean;
  className?: string | Record<string, boolean>;
  keyringId?: string;
};

export const MultichainSrpBackup = ({
  shouldShowBackupReminder = false,
  className = '',
  keyringId,
}: MultichainSrpBackupProps) => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();

  const handleSrpBackupClick = useCallback(() => {
    if (shouldShowBackupReminder) {
      const backUpSRPParams = new URLSearchParams({
        isFromReminder: 'true',
        // Lets the backup flow send the user back to the page they opened it
        // from instead of dropping them on the home page.
        previousPage: `${pathname}${search}`,
      });
      navigate(`${ONBOARDING_REVIEW_SRP_ROUTE}/?${backUpSRPParams.toString()}`);
    } else {
      navigate(
        keyringId ? `${REVEAL_SEED_ROUTE}/${keyringId}` : REVEAL_SEED_ROUTE,
      );
    }
  }, [shouldShowBackupReminder, navigate, keyringId, pathname, search]);

  const finalClassName = classnames('multichain-srp-backup', className);

  return (
    <>
      <Box
        className={finalClassName}
        padding={4}
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
        alignItems={BoxAlignItems.Center}
        backgroundColor={BoxBackgroundColor.BackgroundMuted}
        onClick={handleSrpBackupClick}
        data-testid="multichain-srp-backup"
      >
        <Box>
          <Text
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Medium}
            color={TextColor.TextDefault}
          >
            {t('secretRecoveryPhrase')}
          </Text>
        </Box>
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
        >
          <Text
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Medium}
            color={TextColor.TextAlternative}
          >
            {shouldShowBackupReminder
              ? t('accountDetailsSrpBackUpMessage')
              : t('srpListStateBackedUp')}
          </Text>
          <Box className="ml-2">
            <ButtonIcon
              iconName={IconName.ArrowRight}
              iconProps={{ color: IconColor.IconAlternative }}
              size={ButtonIconSize.Sm}
              ariaLabel={t('secretRecoveryPhrase')}
            />
          </Box>
        </Box>
      </Box>
    </>
  );
};
