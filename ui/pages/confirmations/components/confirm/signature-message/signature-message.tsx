import React, { memo, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { MESSAGE_TYPE } from '../../../../../../shared/constants/app';
import {
  BackgroundColor,
  BorderRadius,
} from '../../../../../helpers/constants/design-system';
import { hexToText } from '../../../../../helpers/utils/util';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { currentConfirmationSelector } from '../../../../../selectors';
import { Box } from '../../../../../components/component-library';
import {
  ConfirmInfo,
  ConfirmInfoRowType,
} from '../../../../../components/app/confirm/info/info';

const SignatureMessage: React.FC = memo(() => {
  const t = useI18nContext();
  const currentConfirmation = useSelector(currentConfirmationSelector);

  const rowConfigs = useMemo(() => {
    if (
      !currentConfirmation ||
      currentConfirmation.type !== MESSAGE_TYPE.PERSONAL_SIGN ||
      !currentConfirmation.msgParams?.data
    ) {
      return null;
    }
    return [
      {
        label: t('message'),
        type: ConfirmInfoRowType.Text,
        rowProps: {
          text: hexToText(currentConfirmation.msgParams?.data),
        },
      },
    ];
  }, [currentConfirmation]);

  if (!rowConfigs?.length) {
    return null;
  }

  return (
    <Box
      backgroundColor={BackgroundColor.backgroundDefault}
      borderRadius={BorderRadius.MD}
      padding={2}
      marginBottom={4}
    >
      <ConfirmInfo rowConfigs={rowConfigs} />
    </Box>
  );
});

export default SignatureMessage;
