import PropTypes from 'prop-types';
import React, { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
import { exportAccount, hideWarning } from '../../../store/actions';
import { FormTextField } from '../../component-library/form-text-field/deprecated';

export const AccountDetailsAuthenticate = ({
  address,
  onCancel,
  setPrivateKey,
  setShowHoldToReveal,
}) => {
  const t = useI18nContext();
  const dispatch = useDispatch();

  const [password, setPassword] = useState('');

  // Password error would result from appState
  const warning = useSelector((state) => state.appState.warning);

  const onSubmit = useCallback(() => {
    dispatch(
      exportAccount(password, address, setPrivateKey, setShowHoldToReveal),
    )
      .then((res) => {
        dispatch(hideWarning());
        return res;
      })
      .catch(() => {
        // No need to do anything more with the caught error here, we already logged the error
      });
  }, [dispatch, password, address, setPrivateKey, setShowHoldToReveal]);

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
