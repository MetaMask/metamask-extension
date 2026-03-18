import React from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
  FontWeight,
  Icon,
  IconName,
  IconSize,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import { Link } from 'react-router-dom';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { REVEAL_SRP_LIST_ROUTE } from '../../../helpers/constants/routes';
import { getIsPrimarySeedPhraseBackedUp } from '../../../ducks/metamask/metamask';

const ManageWalletRecoveryItem = () => {
  const t = useI18nContext();
  const isSRPBackedUp = useSelector(getIsPrimarySeedPhraseBackedUp);

  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      justifyContent={BoxJustifyContent.Between}
      alignItems={BoxAlignItems.Start}
      paddingVertical={3}
    >
      <Box flexDirection={BoxFlexDirection.Column} gap={1}>
        <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
          {t('manageWalletRecovery')}
        </Text>
        {!isSRPBackedUp && (
          <Box
            className="inline-flex self-start items-center gap-1 rounded-md bg-error-muted px-2 py-0.5"
            data-testid="backup-incomplete-tag"
          >
            <Icon
              name={IconName.Danger}
              size={IconSize.Xs}
              className="text-error-default"
            />
            <Text
              variant={TextVariant.BodyXs}
              fontWeight={FontWeight.Medium}
              className="text-error-default"
            >
              {t('backUpIncomplete')}
            </Text>
          </Box>
        )}
      </Box>
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        className="shrink-0"
      >
        <Link to={REVEAL_SRP_LIST_ROUTE} className="flex ml-1">
          <Icon
            name={IconName.ArrowRight}
            size={IconSize.Sm}
            className="text-icon-alternative"
          />
        </Link>
      </Box>
    </Box>
  );
};

export default ManageWalletRecoveryItem;
