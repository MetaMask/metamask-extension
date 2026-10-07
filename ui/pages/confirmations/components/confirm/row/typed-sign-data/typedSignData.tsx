import React from 'react';

import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { Box } from '../../../../../../components/component-library/box/box';
import { BlockSize } from '../../../../../../helpers/constants/design-system';
import { ConfirmInfoRow } from '../../../../../../components/app/confirm/info/row/row';
import { ConfirmInfoRowText } from '../../../../../../components/app/confirm/info/row/text';
import { parseSanitizeTypedDataMessage } from '../../../../utils/confirm';
import { DataTree } from '../dataTree';

export const ConfirmInfoRowTypedSignData = ({
  data,
  tokenDecimals,
  chainId,
}: {
  data: string;
  tokenDecimals?: number;
  chainId: string;
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
        <ConfirmInfoRowText
          text={primaryType}
          data-testid="confirmation__message-primary-type"
        />
      </ConfirmInfoRow>
      <Box style={{ marginLeft: -8 }}>
        <DataTree
          data={sanitizedMessage.value}
          primaryType={primaryType}
          tokenDecimals={tokenDecimals}
          chainId={chainId}
        />
      </Box>
    </Box>
  );
};
