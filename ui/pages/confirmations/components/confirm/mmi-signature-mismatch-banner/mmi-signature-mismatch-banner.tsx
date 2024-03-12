import React, { memo, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { MESSAGE_TYPE } from '../../../../../../shared/constants/app';
import {
  BackgroundColor,
  BlockSize,
  Display,
  IconColor,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import {
  getAccountByAddress,
  shortenAddress,
} from '../../../../../helpers/utils/util';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  accountsWithSendEtherInfoSelector,
  currentConfirmationSelector,
  getSelectedInternalAccount,
} from '../../../../../selectors';
import {
  Box,
  Icon,
  IconName,
  Text,
} from '../../../../../components/component-library';

const MMISignatureMismatchBanner: React.FC = memo(() => {
  const t = useI18nContext();
  const currentConfirmation = useSelector(currentConfirmationSelector);
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const allAccounts = useSelector(accountsWithSendEtherInfoSelector);

  const fromAccount = useMemo(() => {
    if (
      !currentConfirmation ||
      currentConfirmation.type !== MESSAGE_TYPE.PERSONAL_SIGN ||
      !currentConfirmation.msgParams
    ) {
      return null;
    }
    const {
      msgParams: { from },
    } = currentConfirmation;
    return getAccountByAddress(allAccounts, from);
  }, [currentConfirmation, allAccounts]);

  if (
    selectedAccount &&
    fromAccount &&
    selectedAccount.address === fromAccount.address
  ) {
    return null;
  }

  return (
    <Box
      display={Display.Flex}
      width={BlockSize.Full}
      padding={4}
      marginBottom={4}
      backgroundColor={BackgroundColor.primaryMuted}
    >
      <Icon
        name={IconName.Info}
        color={IconColor.infoDefault}
        marginRight={2}
      />
      <Text variant={TextVariant.bodyXs} color={TextColor.textDefault}>
        {t('mismatchAccount', [
          shortenAddress(selectedAccount?.address),
          shortenAddress(fromAccount?.address),
        ])}
      </Text>
    </Box>
  );
});

export default MMISignatureMismatchBanner;
