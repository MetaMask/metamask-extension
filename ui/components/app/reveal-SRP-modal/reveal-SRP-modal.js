import PropTypes from 'prop-types';
import React, { useCallback, useState } from 'react';
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

  const onSubmit = useCallback(
    async (_password) => {
      const seedPhrase = await getSeedPhrase(_password);
      setSecretRecoveryPhrase(seedPhrase);
    },
    [setSecretRecoveryPhrase],
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} data-testid="reveal-srp-modal">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onClose}>{t('revealSeedWords')}</ModalHeader>
        <Box paddingLeft={4} paddingRight={4}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit(password);
            }}
          >
            <FormTextField
              marginTop={6}
              id="account-details-authenticate"
              label={t('enterYourPassword')}
              placeholder={t('password')}
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              variant={TextVariant.bodySm}
              type="password"
              labelProps={{ fontWeight: FontWeight.Medium }}
              autoFocus
            />
          </form>
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
        </Box>
      </ModalContent>
    </Modal>
  );
}

RevealSRPModal.propTypes = {
  /**
   * A function to set a secret receovery phrase in the context that is rendering the RevealSRPModal
   */
  setSecretRecoveryPhrase: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
};
