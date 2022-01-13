import React, { useCallback, useContext } from 'react';
import PropTypes from 'prop-types';
import { I18nContext } from '../../../contexts/i18n';
import Tooltip from '../tooltip';
import Button from '../button';
import CopyIcon from '../icon/copy-icon.component';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import Box from '../box';
import Typography from '../typography';
import {
  COLORS,
  TYPOGRAPHY,
  FONT_WEIGHT,
} from '../../../helpers/constants/design-system';

const TokenDetails = ({
  address,
  onClose = null,
  onHideToken = null,
  value,
  icon,
  currentCurrency,
  decimals,
  network,
}) => {
  const t = useContext(I18nContext);

  const onHideTokenClick = useCallback(() => {
    onHideToken();
  }, [onHideToken]);

  const [copied, handleCopy] = useCopyToClipboard();

  return (
    <Box className="page-container token-details">
      <Box marginLeft={5} marginRight={6}>
        <Typography
          className="token-details__token-details-title"
          fontWeight={FONT_WEIGHT.BOLD}
          margin={[4, 0, 0, 0]}
          variant={TYPOGRAPHY.H6}
          color={COLORS.BLACK}
          onClick={onClose}
        >
          {t('tokenDetailsTitle')}
        </Typography>
        <Box className="token-details__address">
          <Typography
            align="center"
            fontWeight={FONT_WEIGHT.BOLD}
            margin={[0, 5, 0, 0]}
            variant={TYPOGRAPHY.H4}
            color={COLORS.BLACK}
          >
            {value}
          </Typography>
          {icon}
        </Box>
        <Typography
          margin={[4, 0, 0, 0]}
          variant={TYPOGRAPHY.H7}
          color={COLORS.UI4}
        >
          {currentCurrency}
        </Typography>
        <Typography
          margin={[6, 0, 0, 0]}
          variant={TYPOGRAPHY.H9}
          color={COLORS.UI4}
          fontWeight={FONT_WEIGHT.BOLD}
        >
          {t('tokenContractAddress')}
        </Typography>
        <Box className="token-details__copy-token-contract-address">
          <Typography
            variant={TYPOGRAPHY.H7}
            margin={[2, 0, 0, 0]}
            color={COLORS.BLACK}
            className="token-details__copy-token-contract-address__token-address"
          >
            {address}
          </Typography>
          <Tooltip
            position="bottom"
            title={copied ? t('copiedExclamation') : t('copyToClipboard')}
            containerClassName="token-details__copy-token-contract-address__copy-icon"
          >
            <button
              type="link"
              onClick={() => {
                handleCopy(address);
              }}
              title=""
            >
              <CopyIcon size={11} color="#037DD6" />
            </button>
          </Tooltip>
        </Box>
        <Typography
          variant={TYPOGRAPHY.H9}
          margin={[4, 0, 0, 0]}
          color={COLORS.UI4}
          fontWeight={FONT_WEIGHT.BOLD}
        >
          {t('tokenDecimalTitle')}
        </Typography>
        <Typography
          variant={TYPOGRAPHY.H7}
          margin={[1, 0, 0, 0]}
          color={COLORS.BLACK}
        >
          {decimals}
        </Typography>
        <Typography
          variant={TYPOGRAPHY.H9}
          margin={[4, 0, 0, 0]}
          color={COLORS.UI4}
          fontWeight={FONT_WEIGHT.BOLD}
        >
          {t('network')}
        </Typography>
        <Typography
          variant={TYPOGRAPHY.H7}
          margin={[1, 0, 0, 0]}
          color={COLORS.BLACK}
        >
          {network}
        </Typography>
        <Button
          type="primary"
          className="token-details__hide-token-button"
          onClick={onHideTokenClick}
        >
          <Typography variant={TYPOGRAPHY.H6} color={COLORS.PRIMARY1}>
            {t('hideToken')}
          </Typography>
        </Button>
      </Box>
    </Box>
  );
};

TokenDetails.propTypes = {
  address: PropTypes.string,
  onClose: PropTypes.func,
  onHideToken: PropTypes.func,
  value: PropTypes.string,
  icon: PropTypes.element.isRequired,
  currentCurrency: PropTypes.string,
  decimals: PropTypes.number,
  network: PropTypes.string,
};

export default TokenDetails;
