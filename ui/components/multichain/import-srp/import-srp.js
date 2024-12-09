import PropTypes from 'prop-types';
import React from 'react';
import { useDispatch } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import * as actions from '../../../store/actions';
import { Text, Box, ButtonPrimary } from '../../component-library';
import { Textarea, TextareaResize } from '../../component-library/textarea';
import {
  TextVariant,
  BlockSize,
  Display,
  FlexDirection,
} from '../../../helpers/constants/design-system';

export default function SRPImportView({ onActionComplete }) {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const [secretRecoveryPhrase, setSecretRecoveryPhrase] = React.useState('');

  async function importWallet() {
    if (secretRecoveryPhrase.trim()) {
      await dispatch(
        actions.createNewVaultAndRestoreFromMnemonic(
          secretRecoveryPhrase.trim(),
        ),
      );
    }
  }

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      height={BlockSize.Max}
    >
      <Text variant={TextVariant.bodyMd} marginTop={2}>
        {t('importSRPDescription')}
      </Text>

      <Box width={BlockSize.Full} marginTop={4}>
        <Textarea
          value={secretRecoveryPhrase}
          rows={2}
          width={BlockSize.Full}
          resize={TextareaResize.None}
          onChange={(event) => {
            setSecretRecoveryPhrase(event.target.value);
          }}
        />
      </Box>

      <Box width={BlockSize.Full} marginTop={4}>
        <ButtonPrimary
          width={BlockSize.Full}
          onClick={async () => {
            try {
              const result = await importWallet();
              console.log('result', result);
              onActionComplete(true);
              dispatch(actions.showAlert(t('importWalletSuccess')));
              setTimeout((_) => {
                dispatch(actions.hideAlert());
              }, 5000);
            } catch (e) {
              console.error('error', e);
            }
          }}
        >
          {t('importWallet')}
        </ButtonPrimary>
      </Box>
    </Box>
  );
}

SRPImportView.propTypes = {
  /**
   * Executes when the srp is imported
   */
  onActionComplete: PropTypes.func.isRequired,
};
