import React from 'react';
import PropTypes from 'prop-types';
import CopyContractDetails from '../icon/copy-contract-details';
import IconBlockExplorer from '../icon/icon-block-explorer';
import Box from '../box/box';
import Tooltip from '../tooltip/tooltip';
import { useI18nContext } from '../../../hooks/useI18nContext';
import Identicon from '../identicon/identicon.component';
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

export default function ContractTokenValues({ address, tokenName }) {
  const t = useI18nContext();
  const [copied, handleCopy] = useCopyToClipboard();

  return (
    <Box
      display={DISPLAY.FLEX}
      alignItems={ALIGN_ITEMS.CENTER}
      justifyContent={JUSTIFY_CONTENT.CENTER}
      className="contract-token-values"
    >
      <Identicon
        className="contract-token-values__address-identicon"
        address={address}
        diameter={24}
      />
      <Box data-testid="recipient">
        <Typography
          variant={TYPOGRAPHY.H2}
          fontWeight={FONT_WEIGHT.BOLD}
          color={COLORS.TEXT_ALTERNATIVE}
          marginTop={0}
          marginBottom={0}
        >
          {tokenName}
        </Typography>
      </Box>
      <Box display={DISPLAY.FLEX}>
        <Box className="contract-token-values__copy-adress">
          <Tooltip
            position="top"
            title={copied ? t('copiedExclamation') : t('copyToClipboard')}
          >
            <Button
              type="link"
              className="contract-token-values__copy-adress__button"
              onClick={() => {
                handleCopy(address);
              }}
            >
              <CopyContractDetails />
            </Button>
          </Tooltip>
        </Box>
        <Box className="contract-token-values__block-explorer">
          <Tooltip position="top" title={t('openInBlockExplorer')}>
            <Button
              type="link"
              className="contract-token-values__block-explorer__button"
            >
              <IconBlockExplorer />
            </Button>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );
}

ContractTokenValues.propTypes = {
  address: PropTypes.string,
  tokenName: PropTypes.string,
};
