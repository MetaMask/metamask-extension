import React, { useCallback, useContext } from 'react';
import PropTypes from 'prop-types';
import { I18nContext } from '../../../contexts/i18n';
import Popover from '../popover';
import Button from '../button';
import Identicon from '../identicon/identicon.component';
import { shortenAddress } from '../../../helpers/utils/util';
import CopyIcon from '../icon/copy-icon.component';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';

const NicknamePopover = ({ address, onClose = null, onAdd = null }) => {
  const t = useContext(I18nContext);

  const onAddClick = useCallback(() => {
    onAdd(address);
    onClose();
  }, [address, onClose, onAdd]);

  const [copied, handleCopy] = useCopyToClipboard();

  return (
    <div className="nickname-popover">
      <Popover onClose={onClose} className="nickname-popover__popover-wrap">
        <Identicon
          address={address}
          diameter={36}
          className="nickname-popover__identicon"
        />
        <div className="nickname-popover__address">
          {shortenAddress(address)}
        </div>
        <div className="nickname-popover__public-address">
          <div className="nickname-popover__public-address__constant">
            {address}
          </div>
          <button
            type="link"
            onClick={() => {
              handleCopy(address);
            }}
            title={copied ? t('copiedExclamation') : t('copyToClipboard')}
          >
            <CopyIcon size={11} color="#989a9b" />
          </button>
        </div>
        <div className="nickname-popover__view-on-block-explorer">
          {t('viewOnBlockExplorer')}
        </div>
        <Button
          type="primary"
          className="nickname-popover__footer-button"
          onClick={onAddClick}
        >
          {t('addANickname')}
        </Button>
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
