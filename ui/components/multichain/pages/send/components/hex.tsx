// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  getSendHexData,
  updateSendHexData,
  getSendHexDataError,
} from '../../../../../ducks/send';
import {
  TextVariant,
  TextColor,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { INVALID_HEX_DATA_ERROR } from '../../../../../pages/confirmations/send/send.constants';
import { Label, Text } from '../../../../component-library';
import { Textarea } from '../../../../component-library/textarea';
import { SendPageRow } from './send-page-row';

export const SendHexData = () => {
  // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31887
  // eslint-disable-next-line id-length
  const t = useI18nContext();
  const dispatch = useDispatch();

  const data = useSelector(getSendHexData);
  const error = useSelector(getSendHexDataError);
  const isInvalidHexDataError = error === INVALID_HEX_DATA_ERROR;
  const hasError = Boolean(error);

  return (
    <SendPageRow>
      <Label>{t('hexData')}</Label>
      <Textarea
        // TODO: Replace `any` with type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onInput={(event: any) => {
          const newData = event.target.value.replace(/\n/gu, '') || null;
          dispatch(updateSendHexData(newData ?? ''));
        }}
        placeholder={t('optional')}
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31880
        defaultValue={data || ''}
        data-testid="send-hex-textarea"
        error={hasError}
      />
      {isInvalidHexDataError && (
        <Text variant={TextVariant.bodySm} color={TextColor.errorDefault}>
          {t('invalidHexData')}
        </Text>
      )}
    </SendPageRow>
  );
};
