import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import classnames from 'clsx';
import {
  IconSize,
  Box,
  Icon,
  IconName,
  Text,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
  BoxBackgroundColor,
  TextColor,
  TextVariant,
  FontWeight,
  IconColor,
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

export const MultichainSrpBackup: React.FC<MultichainSrpBackupProps> = ({
  shouldShowBackupReminder = false,
  className = '',
  keyringId,
}) => {
  const t = useI18nContext();
  const navigate = useNavigate();

  const handleSrpBackupClick = useCallback(() => {
    if (shouldShowBackupReminder) {
      const backUpSRPRoute = `${ONBOARDING_REVIEW_SRP_ROUTE}/?isFromReminder=true`;
      navigate(backUpSRPRoute);
    } else {
      navigate(
        keyringId ? `${REVEAL_SEED_ROUTE}/${keyringId}` : REVEAL_SEED_ROUTE,
      );
    }
  }, [shouldShowBackupReminder, navigate, keyringId]);

  const finalClassName = classnames(
    'multichain-srp-backup w-full text-left',
    className,
  );

  return (
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
        gap={2}
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
        <Icon
          name={IconName.ArrowRight}
          size={IconSize.Sm}
          color={IconColor.IconAlternative}
        />
      </Box>
    </Box>
  );
};
