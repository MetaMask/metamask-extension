import React, { useEffect, useRef, useState } from 'react';
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
import { IconColor as LegacyIconColor } from '../../../helpers/constants/design-system';
import { convertCaipToHexChainId } from '../../../../shared/lib/network.utils';
import { shortenAddress } from '../../../helpers/utils/util';
import { getImageForChainId } from '../../../selectors/multichain';
import { useI18nContext } from '../../../hooks/useI18nContext';

export type MultichainPrivateKeyRowProps = {
  address: string;
  chainId: CaipChainId;
  isCollapsible: boolean;
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

const COPY_FEEDBACK_DURATION_MS = 1000;

const PrivateKeyContent = ({
  chainId,
  onCopy,
  privateKey,
}: PrivateKeyContentProps) => {
  const t = useI18nContext();
  const [isCopied, setIsCopied] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const copyFeedbackTimeoutRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (copyFeedbackTimeoutRef.current !== null) {
        window.clearTimeout(copyFeedbackTimeoutRef.current);
      }
    },
    [],
  );

  const handleCopy = () => {
    onCopy();
    setIsCopied(true);

    if (copyFeedbackTimeoutRef.current !== null) {
      window.clearTimeout(copyFeedbackTimeoutRef.current);
    }
    copyFeedbackTimeoutRef.current = window.setTimeout(() => {
      setIsCopied(false);
      copyFeedbackTimeoutRef.current = null;
    }, COPY_FEEDBACK_DURATION_MS);
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
        className="relative h-auto min-h-[112px] w-full min-w-0 items-start overflow-hidden rounded-lg bg-muted/50 p-4 hover:bg-muted-hover/50 active:bg-muted-pressed/50"
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
        className={
          isCopied
            ? 'rounded-lg border-success-default bg-success-muted text-success-default hover:bg-success-muted active:bg-success-muted'
            : 'rounded-lg'
        }
        size={ButtonSize.Sm}
        variant={ButtonVariant.Secondary}
        startIconName={
          isCopied ? LegacyIconName.CopySuccess : LegacyIconName.Copy
        }
        startIconProps={{
          color: isCopied
            ? LegacyIconColor.successDefault
            : LegacyIconColor.iconDefault,
        }}
        onClick={handleCopy}
        data-testid={`multichain-private-key-copy-${chainId}`}
      >
        {isCopied ? t('multichainAccountPrivateKeyCopied') : t('copy')}
      </Button>
    </Box>
  );
};

export const MultichainPrivateKeyRow = ({
  address,
  chainId,
  isCollapsible,
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

  const headerContent = (
    <>
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
      {isCollapsible ? (
        <Icon
          name={isExpanded ? IconName.ArrowUp : IconName.ArrowDown}
          color={IconColor.IconAlternative}
          size={IconSize.Sm}
          data-testid={`multichain-private-key-row-toggle-icon-${chainId}`}
        />
      ) : null}
    </>
  );

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      data-testid={`multichain-private-key-row-${chainId}`}
    >
      {isCollapsible ? (
        <ButtonBase
          className="h-auto min-w-0 cursor-pointer justify-start rounded-none bg-transparent px-4 py-3"
          isFullWidth
          onClick={onToggle}
          aria-expanded={isExpanded}
          data-testid={`multichain-private-key-row-toggle-${chainId}`}
        >
          {headerContent}
        </ButtonBase>
      ) : (
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          className="min-w-0 px-4 py-3"
          data-testid={`multichain-private-key-row-toggle-${chainId}`}
        >
          {headerContent}
        </Box>
      )}
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
