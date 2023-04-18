import React from 'react';
import PropTypes from 'prop-types';
import { getAccountLink } from '@metamask/etherscan-link';
import Box from '../box/box';
import Tooltip from '../tooltip/tooltip';
import { useI18nContext } from '../../../hooks/useI18nContext';
import Identicon from '../identicon';
import Typography from '../typography/typography';
import {
  FONT_WEIGHT,
  TypographyVariant,
  DISPLAY,
  AlignItems,
  JustifyContent,
  TextColor,
  Color,
} from '../../../helpers/constants/design-system';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { ButtonIcon, IconName } from '../../component-library';

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
      <Typography
        variant={TypographyVariant.H2}
        fontWeight={FONT_WEIGHT.BOLD}
        color={TextColor.textAlternative}
        marginTop={0}
        marginBottom={0}
      >
        {tokenName}
      </Typography>
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
