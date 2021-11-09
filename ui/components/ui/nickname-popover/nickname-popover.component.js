import React, { useCallback, useContext } from 'react';
import PropTypes from 'prop-types';
import { text } from '@storybook/addon-knobs';
import { I18nContext } from '../../../contexts/i18n';
import Popover from '../popover';
import Button from '../button';
import Identicon from '../identicon/identicon.component';
import { shortenAddress } from '../../../helpers/utils/util';
import CopyIcon from '../icon/copy-icon.component';
import './index.scss';

const NicknamePopover = ({ address, onClose = null, onAdd = null }) => {
  const t = useContext(I18nContext);

  const onAddClick = useCallback(() => {
    onAdd(address);
    onClose();
  }, [address, onClose, onAdd]);

  return (
    <div className="nickname-popover">
      <Popover onClose={onClose} className="nickname-popover__popover-wrap">
        <Identicon
          address={text(
            'Address',
            '0x5e6DaAD1BE117e26590F9eEcD509336ABFBe5966',
          )}
          diameter={36}
          className="nickname-popover__identicon"
        />
        <div className="nickname-popover__address">
          {shortenAddress(address)}
        </div>
        <div className="nickname-popover__public-address">
          <div className="nickname-popover__public-address__contant">
            {address}
          </div>
          <div>
            <CopyIcon size={11} color="#989a9b" />
          </div>
        </div>
        <div className="nickname-popover__view-on-block-explorer">
          {t('viewOnBlockExplorer')}
        </div>
        <div className="nickname-popover__div-button">
          <Button
            type="primary"
            className="nickname-popover__button"
            onClick={onAddClick}
          >
            {t('addANickname')}
          </Button>
        </div>
      </Popover>
    </div>
  );
};

NicknamePopover.propTypes = {
  address: PropTypes.string,
  onClose: PropTypes.func,
  onAdd: PropTypes.func,
};

export default NicknamePopover;
