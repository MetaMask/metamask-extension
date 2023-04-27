import React, { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import {
  DISPLAY,
  SEVERITIES,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  BannerAlert,
  ButtonPrimary,
  ButtonSecondary,
  Text,
  TextField,
} from '../../component-library';
import Box from '../../ui/box/box';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { exportAccount, hideWarning } from '../../../store/actions';

export const AccountDetailsAuthenticate = ({ address, onCancel }) => {
  const t = useI18nContext();
  const dispatch = useDispatch();

  const [password, setPassword] = useState('');

  // Password error would result from appState
  const warning = useSelector((state) => state.appState.warning);

  const onSubmit = useCallback(() => {
    dispatch(exportAccount(password, address)).then((res) => {
      dispatch(hideWarning());
      return res;
    });
  }, [dispatch, password, address]);

  return (
    <>
      <Text marginTop={6} variant={TextVariant.bodySm}>
        {t('enterPassword')}
      </Text>
      <TextField
        type="password"
        onInput={(e) => setPassword(e.target.value)}
        placeholder={t('password')}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onSubmit();
          }
        }}
        autoFocus
      />
      {warning ? (
        <Text
          marginTop={1}
          color={TextColor.errorDefault}
          variant={TextVariant.bodySm}
        >
          {warning}
        </Text>
      ) : null}
      <BannerAlert marginTop={6} severity={SEVERITIES.DANGER}>
        <Text variant={TextVariant.bodySm}>{t('privateKeyWarning')}</Text>
      </BannerAlert>
      <Box display={DISPLAY.FLEX} marginTop={6} gap={2}>
        <ButtonSecondary onClick={onCancel} block>
          {t('cancel')}
        </ButtonSecondary>
        <ButtonPrimary onClick={onSubmit} disabled={password === ''} block>
          {t('submit')}
        </ButtonPrimary>
      </Box>
    </>
  );
};

AccountDetailsAuthenticate.propTypes = {
  address: PropTypes.string.isRequired,
  onCancel: PropTypes.func.isRequired,
};
