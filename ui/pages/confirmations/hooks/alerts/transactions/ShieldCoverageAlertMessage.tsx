'use no memo';

import React from 'react';
import {
  Text,
  TextButton,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../../hooks/useI18nContext';

const SHIELD_LEARN_HOW_COVERAGE_WORKS_URL =
  'https://metamask.io/transaction-shield';

const COVERAGE_AMOUNT = '$10,000';

export const ShieldCoverageAlertMessage = ({
  modalBodyStr,
}: {
  modalBodyStr: string;
}) => {
  const t = useI18nContext();

  return (
    <Text
      variant={TextVariant.BodyMd}
      color={TextColor.TextDefault}
      data-testid="alert-modal__selected-alert"
    >
      {t(modalBodyStr, [
        <TextButton asChild key="link" className="inline">
          <a
            href={SHIELD_LEARN_HOW_COVERAGE_WORKS_URL}
            target="_blank"
            rel="noreferrer noopener"
          >
            {t('shieldCoverageAlertMessageLearnHowCoverageWorks')}
          </a>
        </TextButton>,
        COVERAGE_AMOUNT,
      ])}
    </Text>
  );
};
