import React, { useEffect, useRef, useState } from 'react';
import { CaipChainId } from '@metamask/utils';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Button,
  ButtonBase,
  ButtonSize,
  ButtonVariant,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { shortenAddress } from '../../../helpers/utils/util';
import { getImageForChainId } from '../../../selectors/multichain';
import { useI18nContext } from '../../../hooks/useI18nContext';

export type MultichainPrivateKeyRowProps = {
  address: string;
  chainId: CaipChainId;
  networkName: string;
  onCopy: () => void;
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
      paddingBottom={1}
    >
      <ButtonBase
        className="relative h-auto min-h-[112px] w-full min-w-0 items-start overflow-hidden rounded-lg bg-background-section p-4 hover:bg-background-section active:bg-background-section"
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
        startIconName={isCopied ? IconName.CopySuccess : IconName.Copy}
        startIconProps={{
          color: isCopied ? IconColor.SuccessDefault : IconColor.IconDefault,
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
  networkName,
  onCopy,
  privateKey,
}: MultichainPrivateKeyRowProps) => {
  const networkImageSrc = getImageForChainId(chainId);

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      data-testid={`multichain-private-key-row-${chainId}`}
    >
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        className="min-w-0 px-4 py-3"
        data-testid={`multichain-private-key-row-header-${chainId}`}
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
      </Box>
      <PrivateKeyContent
        chainId={chainId}
        onCopy={onCopy}
        privateKey={privateKey}
      />
    </Box>
  );
};
