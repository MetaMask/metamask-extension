import React, { memo } from 'react';
import { useSelector } from 'react-redux';

import {
  BackgroundColor,
  BorderRadius,
} from '../../../../../helpers/constants/design-system';
import { hexToText } from '../../../../../helpers/utils/util';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { currentConfirmationSelector } from '../../../../../selectors';
import { Box } from '../../../../../components/component-library';
import {
  ConfirmInfoRow,
  ConfirmInfoRowText,
} from '../../../../../components/app/confirm/info/row';

const SignatureMessage: React.FC = memo(() => {
  const t = useI18nContext();
  const currentConfirmation = useSelector(currentConfirmationSelector);

  if (!currentConfirmation?.msgParams?.data) {
    return null;
  }

  return (
    <Box
      backgroundColor={BackgroundColor.backgroundDefault}
      borderRadius={BorderRadius.MD}
      padding={2}
      marginBottom={4}
    >
      <ConfirmInfoRow label={t('message')}>
        <ConfirmInfoRowText
          text={hexToText(currentConfirmation.msgParams?.data)}
        />
      </ConfirmInfoRow>
    </Box>
  );
});

export default SignatureMessage;
