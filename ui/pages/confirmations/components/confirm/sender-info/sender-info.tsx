import React, { memo, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { MESSAGE_TYPE } from '../../../../../../shared/constants/app';
import {
  BackgroundColor,
  BorderRadius,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { currentConfirmationSelector } from '../../../../../selectors';
import { Box } from '../../../../../components/component-library';
import {
  ConfirmInfo,
  ConfirmInfoRowConfig,
  ConfirmInfoRowType,
} from '../../../../../components/app/confirm/info/info';

const SenderInfo: React.FC = memo(() => {
  const t = useI18nContext();
  const currentConfirmation = useSelector(currentConfirmationSelector);
  const [rowConfigs, setRowConfigs] = useState<ConfirmInfoRowConfig[]>([]);

  useEffect(() => {
    if (
      !currentConfirmation ||
      currentConfirmation.type !== MESSAGE_TYPE.PERSONAL_SIGN ||
      !currentConfirmation.msgParams?.origin
    ) {
      return;
    }
    setRowConfigs([
      {
        label: t('origin'),
        type: ConfirmInfoRowType.UrlType,
        rowProps: {
          url: currentConfirmation.msgParams?.origin,
        },
      },
    ]);
  }, [currentConfirmation]);

  const args = useMemo(() => ({ rowConfigs: [...rowConfigs] }), [rowConfigs]);

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
      <ConfirmInfo {...args} />
    </Box>
  );
});

export default SenderInfo;
