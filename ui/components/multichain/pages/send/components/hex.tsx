import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { Label, Text } from '../../../../component-library';
import {
  getSendHexData,
  updateSendHexData,
  getSendHexDataError,
} from '../../../../../ducks/send';
import { Textarea } from '../../../../component-library/textarea';
import { INVALID_HEX_DATA_ERROR } from '../../../../../pages/confirmations/send/send.constants';
import {
  TextVariant,
  TextColor,
} from '../../../../../helpers/constants/design-system';
import { SendPageRow } from './send-page-row';

export const SendHexData = () => {
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
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onInput={(event: any) => {
          const newData = event.target.value.replace(/\n/gu, '') || null;
          dispatch(updateSendHexData(newData ?? ''));
        }}
        placeholder={t('optional')}
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
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
