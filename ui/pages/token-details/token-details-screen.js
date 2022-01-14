import React, { useCallback, useContext } from 'react';
import PropTypes from 'prop-types';
import { I18nContext } from '../../contexts/i18n';
import Tooltip from '../../components/ui/tooltip';
import Button from '../../components/ui/button';
import CopyIcon from '../../components/ui/icon/copy-icon.component';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import Box from '../../components/ui/box';
import Typography from '../../components/ui/typography';
import {
  COLORS,
  TYPOGRAPHY,
  FONT_WEIGHT,
  DISPLAY,
  TEXT_ALIGN,
  OVERFLOW_WRAP,
} from '../../helpers/constants/design-system';

const TokenDetailsScreen = ({
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
          fontWeight={FONT_WEIGHT.BOLD}
          margin={[4, 0, 0, 0]}
          variant={TYPOGRAPHY.H6}
          color={COLORS.BLACK}
        >
          {t('tokenDetailsTitle')}
          <button onClick={onClose} className="token-details__closeButton" />
        </Typography>
        <Box display={DISPLAY.FLEX} marginTop={4}>
          <Typography
            align={TEXT_ALIGN.CENTER}
            fontWeight={FONT_WEIGHT.BOLD}
            margin={[0, 5, 0, 0]}
            variant={TYPOGRAPHY.H4}
            color={COLORS.BLACK}
            className="token-details__token-value"
          >
            {value}
          </Typography>
          <Box marginTop={1}>{icon}</Box>
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
        <Box display={DISPLAY.FLEX}>
          <Typography
            variant={TYPOGRAPHY.H7}
            margin={[2, 0, 0, 0]}
            color={COLORS.BLACK}
            overflowWrap={OVERFLOW_WRAP.BREAK_WORD}
            className="token-details__token-address"
          >
            {address}
          </Typography>
          <Tooltip
            position="bottom"
            title={copied ? t('copiedExclamation') : t('copyToClipboard')}
            containerClassName="token-details__copy-icon"
          >
            <button
              type="link"
              onClick={() => {
                handleCopy(address);
              }}
              title=""
              className="token-details__copyButton"
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

TokenDetailsScreen.propTypes = {
  address: PropTypes.string,
  onClose: PropTypes.func,
  onHideToken: PropTypes.func,
  value: PropTypes.string,
  icon: PropTypes.element.isRequired,
  currentCurrency: PropTypes.string,
  decimals: PropTypes.number,
  network: PropTypes.string,
};

export default TokenDetailsScreen;
