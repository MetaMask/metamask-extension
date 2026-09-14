import React, { useState } from 'react';
import { CaipChainId, KnownCaipNamespace } from '@metamask/utils';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  ButtonBase,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import {
  Button,
  ButtonSize,
  ButtonVariant,
  IconName as LegacyIconName,
} from '../../component-library';
import { convertCaipToHexChainId } from '../../../../shared/lib/network.utils';
import { shortenAddress } from '../../../helpers/utils/util';
import { getImageForChainId } from '../../../selectors/multichain';
import { useI18nContext } from '../../../hooks/useI18nContext';

export type MultichainPrivateKeyRowProps = {
  address: string;
  chainId: CaipChainId;
  isExpanded: boolean;
  networkName: string;
  onCopy: () => void;
  onToggle: () => void;
  privateKey: string;
};

type PrivateKeyContentProps = {
  chainId: CaipChainId;
  onCopy: () => void;
  privateKey: string;
};

const PrivateKeyContent = ({
  chainId,
  onCopy,
  privateKey,
}: PrivateKeyContentProps) => {
  const t = useI18nContext();
  const [isCopied, setIsCopied] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);

  const handleCopy = () => {
    onCopy();
    setIsCopied(true);
  };

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      alignItems={BoxAlignItems.End}
      gap={3}
      paddingHorizontal={4}
      paddingBottom={4}
    >
      <ButtonBase
        className="relative h-auto min-h-[112px] w-full min-w-0 overflow-hidden rounded-lg bg-muted p-4 hover:bg-muted-hover active:bg-muted-pressed"
        onClick={() => setIsRevealed((value) => !value)}
        aria-label={isRevealed ? t('hideSentitiveInfo') : t('tapToReveal')}
        data-testid={`multichain-private-key-reveal-${chainId}`}
      >
        <Text
          variant={TextVariant.BodyMd}
          color={TextColor.TextDefault}
          className="w-full break-all text-left"
          style={isRevealed ? undefined : { filter: 'blur(8px)' }}
          data-testid={`multichain-private-key-value-${chainId}`}
        >
          {isRevealed ? privateKey : '•'.repeat(64)}
        </Text>
        {isRevealed ? null : (
          <Box
            className="absolute inset-0"
            flexDirection={BoxFlexDirection.Column}
            alignItems={BoxAlignItems.Center}
            justifyContent={BoxJustifyContent.Center}
            gap={2}
          >
            <Icon
              name={IconName.EyeSlash}
              color={IconColor.IconDefault}
              size={IconSize.Md}
            />
            <Text
              variant={TextVariant.BodyMd}
              color={TextColor.TextDefault}
              fontWeight={FontWeight.Medium}
            >
              {t('tapToReveal')}
            </Text>
            <Text variant={TextVariant.BodySm} color={TextColor.TextDefault}>
              {t('tapToRevealNote')}
            </Text>
          </Box>
        )}
      </ButtonBase>
      <Button
        size={ButtonSize.Sm}
        variant={ButtonVariant.Secondary}
        startIconName={LegacyIconName.Copy}
        onClick={handleCopy}
        data-testid={`multichain-private-key-copy-${chainId}`}
      >
        {isCopied
          ? t('multichainAccountPrivateKeyCopied')
          : t('copyPrivateKey')}
      </Button>
    </Box>
  );
};

export const MultichainPrivateKeyRow = ({
  address,
  chainId,
  isExpanded,
  networkName,
  onCopy,
  onToggle,
  privateKey,
}: MultichainPrivateKeyRowProps) => {
  const networkImageSrc = getImageForChainId(
    chainId.startsWith(KnownCaipNamespace.Eip155)
      ? convertCaipToHexChainId(chainId)
      : chainId,
  );

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      data-testid={`multichain-private-key-row-${chainId}`}
    >
      <ButtonBase
        className="h-auto min-w-0 justify-start rounded-none bg-transparent px-4 py-3 hover:bg-hover active:bg-pressed"
        isFullWidth
        onClick={onToggle}
        aria-expanded={isExpanded}
        data-testid={`multichain-private-key-row-toggle-${chainId}`}
      >
        <AvatarNetwork
          size={AvatarNetworkSize.Md}
          name={networkName}
          src={networkImageSrc}
          className="mr-3 rounded-lg"
        />
        <Box
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.Start}
          className="min-w-0 flex-1"
        >
          <Text
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Medium}
            color={TextColor.TextDefault}
            ellipsis
            className="w-full text-left"
          >
            {networkName}
          </Text>
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            {shortenAddress(address)}
          </Text>
        </Box>
        <Icon
          name={isExpanded ? IconName.ArrowUp : IconName.ArrowDown}
          color={IconColor.IconAlternative}
          size={IconSize.Sm}
        />
      </ButtonBase>
      {isExpanded ? (
        <PrivateKeyContent
          chainId={chainId}
          onCopy={onCopy}
          privateKey={privateKey}
        />
      ) : null}
    </Box>
  );
};
