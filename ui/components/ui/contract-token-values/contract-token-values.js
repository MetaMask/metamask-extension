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
} from '../../../helpers/constants/design-system';
import Button from '../button';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';

export default function ContractTokenValues({ address, tokenName }) {
  const t = useI18nContext();
  const [copied, handleCopy] = useCopyToClipboard();

  return (
    <Box display={DISPLAY.FLEX} className="contract-token-values">
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
        <Tooltip title={copied ? t('copiedExclamation') : t('copyToClipboard')}>
          <Button
            backgroundColor={COLORS.BACKGROUND_DEFAULT}
            type="link"
            className="contract-token-values__copy-adress"
            onClick={() => {
              handleCopy(address);
            }}
          >
            <CopyContractDetails size={17} />
          </Button>
        </Tooltip>
        <Tooltip title={t('openInBlockExplorer')}>
          <Button
            backgroundColor={COLORS.BACKGROUND_DEFAULT}
            type="link"
            className="contract-token-values__block-explorer"
          >
            <IconBlockExplorer size={13} />
          </Button>
        </Tooltip>
      </Box>
    </Box>
  );
}

ContractTokenValues.propTypes = {
  address: PropTypes.string,
  tokenName: PropTypes.string,
};
