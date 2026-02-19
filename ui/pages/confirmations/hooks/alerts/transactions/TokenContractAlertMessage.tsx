'use no memo';

import React from 'react';
import {
  ButtonLink,
  ButtonLinkSize,
  Text,
} from '../../../../../components/component-library';
import {
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { CONTRACT_ADDRESS_LINK } from '../../../../../helpers/constants/common';

export const TokenContractAlertMessage = () => {
  const t = useI18nContext();

  return (
    <Text
      variant={TextVariant.bodyMd}
      color={TextColor.textDefault}
      data-testid="alert-modal__selected-alert"
    >
      {t('tokenContractError')}{' '}
      <ButtonLink
        size={ButtonLinkSize.Inherit}
        href={CONTRACT_ADDRESS_LINK}
        externalLink
        data-testid="token-contract-alert-learn-more-link"
      >
        {t('learnMore')}
      </ButtonLink>
    </Text>
  );
};
