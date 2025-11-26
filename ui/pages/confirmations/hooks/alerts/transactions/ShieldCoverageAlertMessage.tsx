import React from 'react';
import { ButtonLink, Text } from '../../../../../components/component-library';
import {
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
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
      variant={TextVariant.bodyMd}
      color={TextColor.textDefault}
      data-testid="alert-modal__selected-alert"
    >
      {t(modalBodyStr, [
        <ButtonLink
          href={SHIELD_LEARN_HOW_COVERAGE_WORKS_URL}
          key="link"
          target="_blank"
          rel="noreferrer noopener"
          color={TextColor.primaryDefault}
          style={{ verticalAlign: 'baseline' }}
        >
          {t('shieldCoverageAlertMessageLearnHowCoverageWorks')}
        </ButtonLink>,
        COVERAGE_AMOUNT,
      ])}
    </Text>
  );
};
