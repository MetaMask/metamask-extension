import PropTypes from 'prop-types';
import React from 'react';
import { useDispatch } from 'react-redux';
import { isValidMnemonic } from '@ethersproject/hdnode';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import * as actions from '../../../../store/actions';
import {
  Text,
  Box,
  ButtonPrimary,
  BannerAlert,
} from '../../../component-library';
import { Textarea, TextareaResize } from '../../../component-library/textarea';
import {
  TextVariant,
  BlockSize,
  Display,
  FlexDirection,
  Severity,
} from '../../../../helpers/constants/design-system';

const hasUpperCase = (draftSrp) => {
  return draftSrp !== draftSrp.toLowerCase();
};

export function ImportSRP({ onActionComplete }) {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const [srpError, setSrpError] = React.useState('');
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
          paddingTop={3}
          paddingBottom={3}
          placeholder={t('importSRPPlaceholder')}
          onChange={(event) => {
            const currentSRP = event.target.value;
            setSecretRecoveryPhrase(currentSRP);
            let newSrpError = '';
            const draftSrp = currentSRP.join(' ').trim();

            if (draftSrp.some((word) => word !== '')) {
              if (draftSrp.some((word) => word === '')) {
                newSrpError = t('seedPhraseReq');
              } else if (hasUpperCase(draftSrp)) {
                newSrpError = t('invalidSeedPhraseCaseSensitive');
              } else if (!isValidMnemonic(draftSrp)) {
                newSrpError = t('invalidSeedPhrase');
              }
            }

            setSrpError(newSrpError);
          }}
        />
      </Box>

      <Box width={BlockSize.Full} marginTop={4}>
        <ButtonPrimary
          width={BlockSize.Full}
          disabled={!secretRecoveryPhrase.trim()}
          onClick={async () => {
            try {
              await importWallet();
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
      {srpError ? (
        <BannerAlert severity={Severity.Danger} description={srpError} />
      ) : null}
    </Box>
  );
}

ImportSRP.propTypes = {
  /**
   * Executes when the srp is imported
   */
  onActionComplete: PropTypes.func.isRequired,
};
