import React, { useCallback, useState } from 'react';
import { Hex, isHexString } from '@metamask/utils';
import { useSelector } from 'react-redux';

import {
  Box,
  Text,
  TextField,
  TextFieldSize,
} from '../../../../../components/component-library';
import {
  BlockSize,
  Display,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { getSendHexDataFeatureFlagState } from '../../../../../ducks/metamask/metamask';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useSendContext } from '../../../context/send';
import { useSendType } from '../../../hooks/send/useSendType';

export const HexData = ({
  setHexDataError,
}: {
  setHexDataError: (str?: string) => void;
}) => {
  const t = useI18nContext();
  const { asset, hexData, updateHexData } = useSendContext();
  const [hexDataError, setHexDataErrorLocal] = useState<string>();
  const { isEvmSendType } = useSendType();
  const showHexDataFlag = useSelector(getSendHexDataFeatureFlagState);

  const onChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;
      updateHexData(newValue as Hex);
      const invalidHexData =
        !newValue || isHexString(newValue) ? undefined : t('invalidHexData');
      setHexDataErrorLocal(invalidHexData);
      setHexDataError(invalidHexData);
    },
    [updateHexData, setHexDataErrorLocal, setHexDataError],
  );

  if (!isEvmSendType || !asset?.isNative || !showHexDataFlag) {
    return null;
  }

  return (
    <Box marginTop={4}>
      <Text variant={TextVariant.bodyMd} paddingBottom={1}>
        {t('hexData')}
      </Text>
      <TextField
        error={Boolean(hexDataError)}
        onChange={onChange}
        placeholder={t('hexDataPlaceholder')}
        value={hexData}
        width={BlockSize.Full}
        size={TextFieldSize.Lg}
      />
      {hexDataError && (
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.spaceBetween}
          marginTop={1}
        >
          <Text color={TextColor.errorDefault} variant={TextVariant.bodySm}>
            {hexDataError}
          </Text>
        </Box>
      )}
    </Box>
  );
};
