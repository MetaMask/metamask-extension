import React from 'react';
import PropTypes from 'prop-types';
import { getAccountLink } from '@metamask/etherscan-link';
import Box from '../../../../components/ui/box/box';
import Tooltip from '../../../../components/ui/tooltip/tooltip';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import Identicon from '../../../../components/ui/identicon';
import {
  Text,
  ButtonIcon,
  IconName,
} from '../../../../components/component-library';
import {
  TextVariant,
  DISPLAY,
  AlignItems,
  JustifyContent,
  TextColor,
  Color,
  FontWeight,
} from '../../../../helpers/constants/design-system';
import { useCopyToClipboard } from '../../../../hooks/useCopyToClipboard';

export default function ContractTokenValues({
  address,
  tokenName,
  chainId,
  rpcPrefs,
}) {
  const t = useI18nContext();
  const [copied, handleCopy] = useCopyToClipboard();

  return (
    <Box
      className="contract-token-values"
      display={DISPLAY.FLEX}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.center}
      gap={2}
    >
      <Identicon address={address} diameter={24} />
      <Text
        variant={TextVariant.headingLg}
        fontWeight={FontWeight.Bold}
        color={TextColor.textAlternative}
        marginTop={0}
        marginBottom={0}
      >
        {tokenName}
      </Text>
      <Tooltip
        position="top"
        title={copied ? t('copiedExclamation') : t('copyToClipboard')}
      >
        <ButtonIcon
          iconName={copied ? IconName.CopySuccess : IconName.Copy}
          color={Color.iconMuted}
          onClick={() => handleCopy(address)}
          ariaLabel={copied ? t('copiedExclamation') : t('copyToClipboard')}
        />
      </Tooltip>
      <Tooltip position="top" title={t('openInBlockExplorer')}>
        <ButtonIcon
          display={DISPLAY.FLEX}
          iconName={IconName.Export}
          color={Color.iconMuted}
          onClick={() => {
            const blockExplorerTokenLink = getAccountLink(
              address,
              chainId,
              {
                blockExplorerUrl: rpcPrefs?.blockExplorerUrl ?? null,
              },
              null,
            );
            global.platform.openTab({
              url: blockExplorerTokenLink,
            });
          }}
          ariaLabel={t('openInBlockExplorer')}
        />
      </Tooltip>
    </Box>
  );
}

ContractTokenValues.propTypes = {
  /**
   * Address used for generating token image
   */
  address: PropTypes.string,
  /**
   * Displayed the token name currently tracked in state
   */
  tokenName: PropTypes.string,
  /**
   * Current network chainId
   */
  chainId: PropTypes.string,
  /**
   * RPC prefs
   */
  rpcPrefs: PropTypes.object,
};
