import React, { memo } from 'react';
import { useSelector } from 'react-redux';
import { isEqual } from 'lodash';
import PropTypes from 'prop-types';
import {
  getMemoizedMetaMaskIdentities,
  getAccountName,
} from '../../../../selectors';
import Address from '../../transaction-decoding/components/decoding/address';
import {
  isValidHexAddress,
  toChecksumHexAddress,
} from '../../../../../shared/modules/hexstring-utils';
import Box from '../../../ui/box';
import Typography from '../../../ui/typography';
import {
  DISPLAY,
  FONT_WEIGHT,
  TypographyVariant,
  TextColor,
} from '../../../../helpers/constants/design-system';
import { sanitizeString } from '../../../../helpers/utils/util';

function SignatureRequestData({ data }) {
  const identities = useSelector(getMemoizedMetaMaskIdentities);

  return (
    <Box className="signature-request-data__node">
      {Object.entries(data).map(([label, { value, type }], i) => (
        <Box
          className="signature-request-data__node"
          key={`${label}-${i}`}
          paddingLeft={2}
          display={
            typeof value !== 'object' || value === null ? DISPLAY.FLEX : null
          }
        >
          <Typography
            as="span"
            color={TextColor.textDefault}
            marginLeft={4}
            fontWeight={
              typeof value === 'object' ? FONT_WEIGHT.BOLD : FONT_WEIGHT.NORMAL
            }
          >
            {sanitizeString(label.charAt(0).toUpperCase() + label.slice(1))}:{' '}
          </Typography>
          {typeof value === 'object' && value !== null ? (
            <SignatureRequestData data={value} />
          ) : (
            <Typography
              as="span"
              color={TextColor.textDefault}
              marginLeft={4}
              className="signature-request-data__node__value"
            >
              {type === 'address' &&
              isValidHexAddress(value, {
                mixedCaseUseChecksum: true,
              }) ? (
                <Typography
                  variant={TypographyVariant.H7}
                  color={TextColor.infoDefault}
                  className="signature-request-data__node__value__address"
                >
                  <Address
                    addressOnly
                    checksummedRecipientAddress={toChecksumHexAddress(value)}
                    recipientName={getAccountName(identities, value)}
                  />
                </Typography>
              ) : (
                sanitizeString(`${value}`)
              )}
            </Typography>
          )}
        </Box>
      ))}
    </Box>
  );
}

SignatureRequestData.propTypes = {
  data: PropTypes.oneOfType([PropTypes.object, PropTypes.array]).isRequired,
};

export default memo(SignatureRequestData, (prevProps, nextProps) => {
  return isEqual(prevProps.data, nextProps.data);
});
