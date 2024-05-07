import { TransactionType } from '@metamask/transaction-controller';
import React, { memo, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Text } from '../../../../../components/component-library';
import {
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { currentConfirmationSelector } from '../../../../../selectors';
import { Confirmation } from '../../../types/confirm';

const ConfirmTitle: React.FC = memo(() => {
  const t = useI18nContext();
  const currentConfirmation = useSelector(
    currentConfirmationSelector,
  ) as Confirmation;

  const typeToTitleTKey: Partial<Record<TransactionType, string>> = useMemo(
    () => ({
      [TransactionType.personalSign]: t('confirmTitleSignature'),
      [TransactionType.signTypedData]: t('confirmTitleSignature'),
      [TransactionType.contractInteraction]: t('confirmTitleTransaction'),
    }),
    [],
  );

  const typeToDescTKey: Partial<Record<TransactionType, string>> = useMemo(
    () => ({
      [TransactionType.personalSign]: t('confirmTitleDescSignature'),
      [TransactionType.signTypedData]: t('confirmTitleDescSignature'),
      [TransactionType.contractInteraction]: t(
        'confirmTitleDescContractInteractionTransaction',
      ),
    }),
    [],
  );

  if (!currentConfirmation) {
    return null;
  }

  const title =
    typeToTitleTKey[
      currentConfirmation.type || TransactionType.contractInteraction
    ];
  const description =
    typeToDescTKey[
      currentConfirmation.type || TransactionType.contractInteraction
    ];

  return (
    <>
      <Text
        variant={TextVariant.headingLg}
        paddingTop={4}
        paddingBottom={2}
        textAlign={TextAlign.Center}
      >
        {title}
      </Text>
      <Text
        paddingBottom={4}
        color={TextColor.textAlternative}
        textAlign={TextAlign.Center}
      >
        {description}
      </Text>
    </>
  );
});

export default ConfirmTitle;
