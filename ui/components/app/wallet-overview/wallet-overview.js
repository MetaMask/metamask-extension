import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useSelector } from 'react-redux';
import { toChecksumHexAddress } from '../../../../shared/modules/hexstring-utils';
import { getSelectedInternalAccount } from '../../../selectors';
import { AddressCopyButton } from '../../multichain';
import Box from '../../ui/box/box';
import {
  TextVariant,
  TextColor,
  Display,
} from '../../../helpers/constants/design-system';
import { Tag, IconName } from '../../component-library';

const WalletOverview = ({
  balance,
  buttons,
  className,
  showAddress = false,
}) => {
  const selectedIdentity = useSelector(getSelectedInternalAccount);
  const checksummedAddress = toChecksumHexAddress(selectedIdentity?.address);
  const label = selectedIdentity.metadata?.snap?.name;
  console.log('WalletOverview', label);

  return (
    <div className={classnames('wallet-overview', className)}>
      <div className="wallet-overview__balance">
        {showAddress ? (
          <Box marginTop={2}>
            <AddressCopyButton address={checksummedAddress} shorten />
          </Box>
        ) : null}
        {balance}
        {label ? (
          <Tag
            display={Display.Flex}
            gap={1}
            style={{
              paddingTop: '2px',
              paddingRight: '8px',
              paddingBottom: '2px',
              paddingLeft: '4px',
            }}
            marginTop={-1}
            marginBottom={3}
            label={label}
            labelProps={{
              variant: TextVariant.bodyXs,
              color: TextColor.textAlternative,
            }}
            iconName={IconName.Snaps}
          />
        ) : null}
      </div>
      <div className="wallet-overview__buttons">{buttons}</div>
    </div>
  );
};

WalletOverview.propTypes = {
  balance: PropTypes.element.isRequired,
  buttons: PropTypes.element.isRequired,
  className: PropTypes.string,
  showAddress: PropTypes.bool,
};

export default WalletOverview;
