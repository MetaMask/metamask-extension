import React from 'react';
import PropTypes from 'prop-types';
import { getAccountLink } from '@metamask/etherscan-link';
import IconCopy from '../icon/icon-copy';
import IconBlockExplorer from '../icon/icon-block-explorer';
import Box from '../box/box';
import Tooltip from '../tooltip/tooltip';
import { useI18nContext } from '../../../hooks/useI18nContext';
import Identicon from '../identicon';
import Typography from '../typography/typography';
import {
  FONT_WEIGHT,
  TYPOGRAPHY,
  DISPLAY,
  COLORS,
  ALIGN_ITEMS,
  JUSTIFY_CONTENT,
} from '../../../helpers/constants/design-system';
import Button from '../button';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';

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
      display={DISPLAY.FLEX}
      alignItems={ALIGN_ITEMS.CENTER}
      justifyContent={JUSTIFY_CONTENT.CENTER}
      className="contract-token-values"
    >
      <Box marginRight={2}>
        <Identicon address={address} diameter={24} />
      </Box>
      <Typography
        variant={TYPOGRAPHY.H2}
        fontWeight={FONT_WEIGHT.BOLD}
        color={COLORS.TEXT_ALTERNATIVE}
        marginTop={0}
        marginBottom={0}
      >
        {tokenName}
      </Typography>
      <Box className="contract-token-values__copy-address">
        <Tooltip
          position="top"
          title={copied ? t('copiedExclamation') : t('copyToClipboard')}
        >
          <Button
            type="link"
            className="contract-token-values__copy-address__button"
            onClick={() => {
              handleCopy(address);
            }}
          >
            <IconCopy size={24} color="var(--color-icon-muted)" />
          </Button>
        </Tooltip>
      </Box>
      <Box className="contract-token-values__block-explorer">
        <Tooltip position="top" title={t('openInBlockExplorer')}>
          <Button
            type="link"
            className="contract-token-values__block-explorer__button"
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
          >
            <IconBlockExplorer size={24} color="var(--color-icon-muted)" />
          </Button>
        </Tooltip>
      </Box>
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
