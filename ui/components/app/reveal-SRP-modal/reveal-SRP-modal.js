import PropTypes from 'prop-types';
import React, { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Display,
  TextVariant,
  FontWeight,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getSeedPhrase } from '../../../store/actions';
import {
  Box,
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  ButtonPrimary,
  ButtonSecondary,
  FormTextField,
} from '../../component-library';

export default function RevealSRPModal({
  setSecretRecoveryPhrase,
  onClose,
  isOpen,
}) {
  const t = useI18nContext();

  const [password, setPassword] = useState('');

  // Password error would result from appState
  const warning = useSelector((state) => state.appState.warning);

  const onSubmit = useCallback(
    async (_password) => {
      const seedPhrase = await getSeedPhrase(_password);
      setSecretRecoveryPhrase(seedPhrase);
    },
    [setSecretRecoveryPhrase],
  );

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === 'Enter') {
        onSubmit();
      }
    },
    [onSubmit],
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onClose}>{t('revealSeedWords')}</ModalHeader>
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
          <Box display={Display.Flex} marginTop={6} gap={2}>
            <ButtonSecondary onClick={onClose} block>
              {t('cancel')}
            </ButtonSecondary>
            <ButtonPrimary
              onClick={() => onSubmit(password)}
              disabled={password === ''}
              block
            >
              {t('confirm')}
            </ButtonPrimary>
          </Box>
        </>
      </ModalContent>
    </Modal>
  );
}

RevealSRPModal.propTypes = {
  /**
   * A function to set a secret receovery phrase in the context that is rendering the RevealSRPModal
   */
  setSecretRecoveryPhrase: PropTypes.function,
  onClose: PropTypes.function,
  isOpen: PropTypes.bool,
};
