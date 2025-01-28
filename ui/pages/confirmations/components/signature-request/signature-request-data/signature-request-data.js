import React, { memo } from 'react';
import { useSelector } from 'react-redux';
import { isEqual } from 'lodash';
import PropTypes from 'prop-types';
import { NameType } from '@metamask/name-controller';
import {
  getMemoizedMetaMaskInternalAccounts,
  getAccountName,
} from '../../../../../selectors';
import Address from '../../transaction-decoding/components/decoding/address';
import {
  isValidHexAddress,
  toChecksumHexAddress,
} from '../../../../../../shared/modules/hexstring-utils';
import {
  Display,
  FontWeight,
  TextVariant,
  TextColor,
} from '../../../../../helpers/constants/design-system';
import { sanitizeString } from '../../../../../helpers/utils/util';
import { Box, Text } from '../../../../../components/component-library';
import { usePetnamesEnabled } from '../../../../../hooks/usePetnamesEnabled';
import Name from '../../../../../components/app/name/name';

function SignatureRequestData({ chainId, data }) {
  const internalAccounts = useSelector(getMemoizedMetaMaskInternalAccounts);
  const petnamesEnabled = usePetnamesEnabled();

  return (
    <Box as="ul" className="signature-request-data__node">
      {Object.entries(data).map(([label, { value, type }], i) => (
        <Box
          as="li"
          className="signature-request-data__node"
          marginBottom={2}
          key={`${label}-${i}`}
          paddingLeft={2}
          display={
            typeof value !== 'object' || value === null ? Display.Flex : null
          }
        >
          <Text
            as="div"
            color={TextColor.textDefault}
            marginLeft={4}
            fontWeight={
              typeof value === 'object' ? FontWeight.Bold : FontWeight.Normal
            }
          >
            {sanitizeString(label.charAt(0).toUpperCase() + label.slice(1))}:{' '}
          </Text>
          {typeof value === 'object' && value !== null ? (
            <SignatureRequestData data={value} chainId={chainId} />
          ) : (
            <Text
              as="div"
              color={TextColor.textDefault}
              marginLeft={4}
              className="signature-request-data__node__value"
            >
              {type === 'address' &&
              isValidHexAddress(value, {
                mixedCaseUseChecksum: true,
              }) ? (
                <Text
                  variant={TextVariant.bodySm}
                  as="div"
                  color={TextColor.infoDefault}
                  className="signature-request-data__node__value__address"
                >
                  {petnamesEnabled ? (
                    <Name
                      value={value}
                      type={NameType.ETHEREUM_ADDRESS}
                      variation={chainId}
                    />
                  ) : (
                    <Address
                      addressOnly
                      checksummedRecipientAddress={toChecksumHexAddress(value)}
                      recipientName={getAccountName(internalAccounts, value)}
                    />
                  )}
                </Text>
              ) : (
                sanitizeString(`${value}`)
              )}
            </Text>
          )}
        </Box>
      ))}
    </Box>
  );
}

SignatureRequestData.propTypes = {
  chainId: PropTypes.string,
  data: PropTypes.oneOfType([PropTypes.object, PropTypes.array]).isRequired,
};

export default memo(SignatureRequestData, (prevProps, nextProps) => {
  return isEqual(prevProps.data, nextProps.data);
});
