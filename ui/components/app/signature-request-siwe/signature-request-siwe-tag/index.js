import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { I18nContext } from '../../../../contexts/i18n';
import Tooltip from '../../../ui/tooltip';
import {
  TYPOGRAPHY,
  SIZES,
  DISPLAY,
  ALIGN_ITEMS,
  COLORS,
} from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box';
import Typography from '../../../ui/typography/typography';

const SignatureRequestSIWETag = ({ domain }) => {
  const t = useContext(I18nContext);
  return (
    <div className="signature-request-siwe-tag">
      <Tooltip
        position="bottom"
        html={<p>{t('SIWEDomainWarningBody', [domain])}</p>}
      >
        <Box
          marginRight={1}
          display={DISPLAY.INLINE_FLEX}
          alignItems={ALIGN_ITEMS.CENTER}
          backgroundColor={COLORS.ERROR_DEFAULT}
          borderRadius={SIZES.XL}
          paddingLeft={4}
          paddingRight={4}
        >
          <Typography
            fontWeight="bold"
            margin={0}
            variant={TYPOGRAPHY.H7}
            color={COLORS.ERROR_INVERSE}
          >
            {t('SIWEDomainWarningLabel')}
          </Typography>
        </Box>
      </Tooltip>
    </div>
  );
};

export default SignatureRequestSIWETag;

SignatureRequestSIWETag.propTypes = {
  /**
   * The domain of the site that is requesting the signature
   */
  domain: PropTypes.string,
};
