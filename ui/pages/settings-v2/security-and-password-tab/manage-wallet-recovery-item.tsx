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
import { getIsPrimarySeedPhraseBackedUp } from '../../../ducks/metamask/metamask';
import { SECURITY_ITEMS } from '../search-config';

type ManageWalletRecoveryItemProps = {
  route: string;
};

const ManageWalletRecoveryItem = ({ route }: ManageWalletRecoveryItemProps) => {
  const t = useI18nContext();
  const isSRPBackedUp = useSelector(getIsPrimarySeedPhraseBackedUp);

  return (
    <Link
      to={route}
      data-testid="reveal-seed-words"
      className="block rounded-none text-inherit no-underline hover:bg-background-default-hover"
    >
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
        alignItems={BoxAlignItems.Start}
        paddingVertical={3}
        paddingHorizontal={4}
      >
        <Box flexDirection={BoxFlexDirection.Column} gap={1}>
          <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
            {t(SECURITY_ITEMS['manage-wallet-recovery'])}
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
          <Icon
            name={IconName.ArrowRight}
            size={IconSize.Sm}
            className="text-icon-alternative"
          />
        </Box>
      </Box>
    </Link>
  );
};

export default ManageWalletRecoveryItem;
