import React from 'react';

import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { Box } from '../../../../../../components/component-library';
import { BlockSize } from '../../../../../../helpers/constants/design-system';
import {
  ConfirmInfoRow,
  ConfirmInfoRowText,
} from '../../../../../../components/app/confirm/info/row';

import { DataTree } from '../dataTree';
import { parseSanitizeTypedDataMessage } from '../../../../utils';

export const ConfirmInfoRowTypedSignData = ({
  data,
  isPermit,
}: {
  data: string;
  isPermit?: boolean;
}) => {
  const t = useI18nContext();

  if (!data) {
    return null;
  }

  const { sanitizedMessage, primaryType } = parseSanitizeTypedDataMessage(data);

  return (
    <Box width={BlockSize.Full}>
      <ConfirmInfoRow
        label={`${t('primaryType')}:`}
        style={{ paddingLeft: 0, paddingRight: 0 }}
      >
        <ConfirmInfoRowText text={primaryType} />
      </ConfirmInfoRow>
      <Box style={{ marginLeft: -8 }}>
        <DataTree data={sanitizedMessage.value} isPermit={isPermit} />
      </Box>
    </Box>
  );
};
