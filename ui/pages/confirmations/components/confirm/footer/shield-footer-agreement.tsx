import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import React from 'react';
import {
  Box,
  ButtonLink,
  ButtonLinkSize,
  Text,
} from '../../../../../components/component-library';
import {
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../context/confirm';
import { SHIELD_TERMS_OF_USE_URL } from '../../../../../../shared/lib/ui-utils';

const ShieldFooterAgreement = () => {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const t = useI18nContext();

  if (currentConfirmation?.type !== TransactionType.shieldSubscriptionApprove) {
    return null;
  }

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      justifyContent={JustifyContent.center}
      gap={4}
    >
      <Text variant={TextVariant.bodySm} color={TextColor.textAlternative}>
        {t('shieldFooterAgreement', [
          <ButtonLink
            href={SHIELD_TERMS_OF_USE_URL}
            size={ButtonLinkSize.Inherit}
            externalLink
            key="shield-footer-agreement-button"
          >
            {t('snapsTermsOfUse')}
          </ButtonLink>,
        ])}
      </Text>
    </Box>
  );
};

export default ShieldFooterAgreement;
