import React from 'react';

import { sanitizeMessage } from '../../../../../../helpers/utils/util';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { Box } from '../../../../../../components/component-library';
import { BlockSize } from '../../../../../../helpers/constants/design-system';
import {
  ConfirmInfoRow,
  ConfirmInfoRowText,
} from '../../../../../../components/app/confirm/info/row';

import { DataTree } from './dataTree';

const parseMessage = (dataToParse: string) => {
  const { message, primaryType, types } = JSON.parse(dataToParse);
  const sanitizedMessage = sanitizeMessage(message, primaryType, types);
  return { sanitizedMessage, primaryType };
};

export const ConfirmInfoRowTypedSignData = ({ data }: { data: string }) => {
  const t = useI18nContext();

  if (!data) {
    return null;
  }

  const { sanitizedMessage, primaryType } = parseMessage(data);

  return (
    <Box width={BlockSize.Full} style={{ margin: '0 -8px' }}>
      <ConfirmInfoRow label={`${t('primaryType')}:`}>
        <ConfirmInfoRowText text={primaryType} />
      </ConfirmInfoRow>
      <Box style={{ margin: '0 -8px' }}>
        <DataTree data={sanitizedMessage.value} />
      </Box>
    </Box>
  );
};
