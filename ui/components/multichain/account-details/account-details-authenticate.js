import PropTypes from 'prop-types';
import React, { useCallback, useState } from 'react';
import {
  BannerAlert,
  BannerAlertSeverity,
  Box,
  BoxFlexDirection,
  Button,
  ButtonVariant,
} from '@metamask/design-system-react';
import {
  FontWeight,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { exportAccount } from '../../../store/actions';
import { FormTextField } from '../../component-library/form-text-field/deprecated';
import { captureException } from '../../../../shared/lib/sentry';
import { useAppDispatch } from '../../../store/hooks';

export const AccountDetailsAuthenticate = ({
  address,
  onCancel,
  setPrivateKey,
  setShowHoldToReveal,
}) => {
  const t = useI18nContext();
  const dispatch = useAppDispatch();

  const [password, setPassword] = useState('');
  const [warning, setWarning] = useState('');

  const onSubmit = useCallback(() => {
    dispatch(
      exportAccount(password, address, setPrivateKey, setShowHoldToReveal),
    )
      .then((res) => {
        if (res && res.error && res.error === 'invalidPassword') {
          setWarning(t('wrongPassword'));
        } else if (warning !== '') {
          setWarning('');
        }
      })
      .catch((error) => {
        setWarning(t('unexpectedError'));
        captureException(error);
      });
  }, [
    dispatch,
    password,
    address,
    setPrivateKey,
    setShowHoldToReveal,
    setWarning,
    t,
    warning,
  ]);

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === 'Enter') {
        onSubmit();
      }
    },
    [onSubmit],
  );

  return (
    <>
      <FormTextField
        marginTop={6}
        id="account-details-authenticate"
        label={t('enterYourPassword')}
        placeholder={t('password')}
        error={Boolean(warning)}
        helpText={warning}
        onChange={(e) => setPassword(e.target.value)}
        value={password}
        variant={TextVariant.bodySm}
        type="password"
        inputProps={{ onKeyPress: handleKeyPress }}
        labelProps={{ fontWeight: FontWeight.Medium }}
        autoFocus
      />
      <BannerAlert
        marginTop={6}
        severity={BannerAlertSeverity.Danger}
        description={t('privateKeyWarning')}
      />
      <Box flexDirection={BoxFlexDirection.Row} marginTop={6} gap={2}>
        <Button
          variant={ButtonVariant.Secondary}
          onClick={onCancel}
          isFullWidth
        >
          {t('cancel')}
        </Button>
        <Button
          variant={ButtonVariant.Primary}
          onClick={onSubmit}
          disabled={password === ''}
          isFullWidth
        >
          {t('confirm')}
        </Button>
      </Box>
    </>
  );
};

AccountDetailsAuthenticate.propTypes = {
  /**
   * The account address
   */
  address: PropTypes.string.isRequired,
  /**
   * Executes upon Cancel button click
   */
  onCancel: PropTypes.func.isRequired,
  /**
   * Private key setter
   */
  setPrivateKey: PropTypes.func.isRequired,
  /**
   * showHoldToReveal setter
   */
  setShowHoldToReveal: PropTypes.func.isRequired,
};
