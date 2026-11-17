import React from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  ContentVariant,
  FontWeight,
  Icon,
  IconName,
  IconSize,
  ListItem,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import { Link, useNavigate } from 'react-router-dom';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getIsPrimarySeedPhraseBackedUp } from '../../../ducks/metamask/metamask';
import { transitionForward } from '../../../components/ui/transition';
import { SECURITY_ITEMS } from '../search-config';

type ManageWalletRecoveryItemProps = {
  route: string;
};

const ManageWalletRecoveryItem = ({ route }: ManageWalletRecoveryItemProps) => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const isSRPBackedUp = useSelector(getIsPrimarySeedPhraseBackedUp);

  return (
    <Link
      to={route}
      data-testid="reveal-seed-words"
      className="block rounded-none text-inherit no-underline hover:bg-background-default-hover"
      onClick={(event) => {
        event.preventDefault();
        transitionForward(() => navigate(route));
      }}
    >
      <ListItem
        variant={
          isSRPBackedUp ? ContentVariant.OneLine : ContentVariant.TwoLines
        }
        title={t(SECURITY_ITEMS['manage-wallet-recovery'])}
        description={
          isSRPBackedUp ? undefined : (
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
          )
        }
        endAccessory={
          <Icon
            name={IconName.ArrowRight}
            size={IconSize.Sm}
            className="text-icon-alternative"
          />
        }
      />
    </Link>
  );
};

export default ManageWalletRecoveryItem;
