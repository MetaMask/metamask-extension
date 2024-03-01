import React, { memo, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { MESSAGE_TYPE } from '../../../../../../../shared/constants/app';
import {
  BackgroundColor,
  BorderRadius,
} from '../../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { currentConfirmationSelector } from '../../../../../../selectors';
import { Box } from '../../../../../../components/component-library';
import { ConfirmInfoRowUrl } from '../../../../../../components/app/confirm/info/row';

const Info: React.FC = memo(() => {
  const t = useI18nContext();
  const currentConfirmation = useSelector(currentConfirmationSelector);

  return (
    <Box
      backgroundColor={BackgroundColor.backgroundDefault}
      borderRadius={BorderRadius.MD}
      padding={2}
      marginBottom={4}
    >
      <ConfirmInfoRowUrl url={currentConfirmation.msgParams?.origin} />
    </Box>
  );
});

export default Info;
