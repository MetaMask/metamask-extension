import React from 'react';
import { AccountDetailsRow } from '../account-details-row';
import {
  Box,
  IconName,
  ButtonIcon,
  ButtonIconSize,
} from '../../component-library';
import {
  Display,
  FlexDirection,
  IconColor,
  TextColor,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';

type AccountSecretsSectionProps = {
  includeSRP?: boolean;
};

export const AccountSecretsSection = ({
  includeSRP = false,
}: AccountSecretsSectionProps) => {
  const SECRET_RECOVERY_PHRASE_NUMBER = 1;
  const t = useI18nContext();
  const hasBackedUp = false;

  const handleShowSRP = () => {

  }

  const handleShowPrivateKey = () => {

  }

  return (
    <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
      {includeSRP && (
        <AccountDetailsRow
          label={t('secretRecoveryPhrasePlusNumber', [
            SECRET_RECOVERY_PHRASE_NUMBER,
          ])}
          value={hasBackedUp ? t('backUp') : ''}
          valueColor={hasBackedUp ? TextColor.textDefault : TextColor.errorDefault}
          endAccessory={
            <ButtonIcon
              iconName={IconName.ArrowRight}
              color={IconColor.iconAlternative}
              size={ButtonIconSize.Md}
              ariaLabel={
                hasBackedUp
                  ? t('viewSecretRecoveryPhrase')
                  : t('backupSecretRecoveryPhrase')
              }
              marginLeft={2}
              onClick={handleShowSRP}
            />
          }
          style={{
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px',
            marginBottom: '1px',
          }}
        />
      )}
      <AccountDetailsRow
        label={t('privateKey')}
        endAccessory={
          <ButtonIcon
            iconName={IconName.ArrowRight}
            color={IconColor.iconAlternative}
            size={ButtonIconSize.Md}
            ariaLabel={t('viewPrivateKey')}
            marginLeft={2}
            onClick={handleShowPrivateKey}
          />
        }
        style={{
          ...(includeSRP
            ? {}
            : { borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }),
          borderBottomLeftRadius: '8px',
          borderBottomRightRadius: '8px',
        }}
      />
    </Box>
  );
};
