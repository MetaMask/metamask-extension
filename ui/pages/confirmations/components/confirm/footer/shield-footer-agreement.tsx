import {
  Box,
  BoxFlexDirection,
  BoxJustifyContent,
  Text,
  TextButton,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import React from 'react';
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
      flexDirection={BoxFlexDirection.Row}
      justifyContent={BoxJustifyContent.Center}
      gap={4}
    >
      <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
        {t('shieldFooterAgreement', [
          <TextButton
            asChild
            key="shield-footer-agreement-button"
            className="inline font-normal"
          >
            <a
              href={SHIELD_TERMS_OF_USE_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('snapsTermsOfUse')}
            </a>
          </TextButton>,
        ])}
      </Text>
    </Box>
  );
};

export default ShieldFooterAgreement;
