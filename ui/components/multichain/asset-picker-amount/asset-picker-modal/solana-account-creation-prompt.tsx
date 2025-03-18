import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Text,
  Button,
  ButtonSize,
  ButtonVariant,
} from '../../../component-library';
import {
  Display,
  TextAlign,
  TextColor,
  TextVariant,
  AlignItems,
  JustifyContent,
  FlexDirection,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { MultichainNetworks } from '../../../../../shared/constants/multichain/networks';
import { getMetaMaskKeyrings } from '../../../../selectors';
import {
  WalletClientType,
  useMultichainWalletSnapClient,
} from '../../../../hooks/accounts/useMultichainWalletSnapClient';

export const SolanaAccountCreationPrompt = ({
  onSuccess,
}: {
  onSuccess: () => void;
}) => {
  const t = useI18nContext();
  const solanaWalletSnapClient = useMultichainWalletSnapClient(
    WalletClientType.Solana,
  );
  const [primaryKeyring] = useSelector(getMetaMaskKeyrings);
  const [isCreating, setIsCreating] = React.useState(false);

  const handleCreateAccount = useCallback(async () => {
    try {
      setIsCreating(true);
      await solanaWalletSnapClient.createAccount(
        MultichainNetworks.SOLANA,
        primaryKeyring.metadata.id,
      );
      onSuccess();
    } catch (error) {
      console.error('Error creating Solana account:', error);
    } finally {
      setIsCreating(false);
    }
  }, [solanaWalletSnapClient, primaryKeyring?.metadata?.id, onSuccess]);

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.flexStart}
      gap={1}
      padding={4}
      className="solana-account-creation-prompt"
      data-testid="solana-account-creation-prompt"
      style={{ height: '100vh', paddingTop: '72px' }}
    >
      <img
        src="/images/solana-logo.svg"
        alt="Solana Logo"
        style={{
          width: '30px',
          height: '30px',
          marginBottom: '4px',
          borderRadius: '4px',
        }}
      />

      <Text
        variant={TextVariant.headingSm}
        textAlign={TextAlign.Center}
        color={TextColor.textDefault}
      >
        {t('bridgeCreateSolanaAccountTitle')}
      </Text>

      <Text
        variant={TextVariant.bodySm}
        textAlign={TextAlign.Center}
        color={TextColor.textAlternative}
      >
        {t('bridgeCreateSolanaAccountDescription')}
      </Text>

      <Button
        block
        size={ButtonSize.Md}
        variant={ButtonVariant.Secondary}
        onClick={handleCreateAccount}
        loading={isCreating}
        data-testid="create-solana-account-button"
        style={{ width: '75%', marginTop: '10px' }}
      >
        {t('createSolanaAccount')}
      </Button>
    </Box>
  );
};
