import React, { useCallback, useContext } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import { I18nContext } from '../../../contexts/i18n';
import Tooltip from '../tooltip';
import Popover from '../popover';
import Button from '../button';
import Identicon from '../identicon';
import { shortenAddress } from '../../../helpers/utils/util';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { getTokenList, getBlockExplorerLinkText } from '../../../selectors';
import { NETWORKS_ROUTE } from '../../../helpers/constants/routes';
import { ButtonIcon, IconName, IconSize } from '../../component-library';

const NicknamePopover = ({
  address,
  nickname,
  onClose = null,
  onAdd = null,
  explorerLink,
}) => {
  const t = useContext(I18nContext);
  const history = useHistory();

  const onAddClick = useCallback(() => {
    onAdd();
  }, [onAdd]);

  const [copied, handleCopy] = useCopyToClipboard();
  const tokenList = useSelector(getTokenList);
  const blockExplorerLinkText = useSelector(getBlockExplorerLinkText);

  const routeToAddBlockExplorerUrl = () => {
    history.push(`${NETWORKS_ROUTE}#blockExplorerUrl`);
  };

  const openBlockExplorer = () => {
    global.platform.openTab({
      url: explorerLink,
    });
  };

  return (
    <div className="nickname-popover">
      <Popover onClose={onClose} className="nickname-popover__popover-wrap">
        <Identicon
          address={address}
          diameter={36}
          className="nickname-popover__identicon"
          image={tokenList[address.toLowerCase()]?.iconUrl}
        />
        <div className="nickname-popover__address">
          {nickname || shortenAddress(address)}
        </div>
        <div className="nickname-popover__public-address">
          <div className="nickname-popover__public-address__constant">
            {address}
          </div>

          <Tooltip
            position="bottom"
            title={copied ? t('copiedExclamation') : t('copyToClipboard')}
          >
            <ButtonIcon
              iconName={copied ? IconName.CopySuccess : IconName.Copy}
              size={IconSize.Sm}
              onClick={() => handleCopy(address)}
            />
          </Tooltip>
        </div>

        <div className="nickname-popover__view-on-block-explorer">
          <Button
            type="link"
            className="nickname-popover__etherscan-link"
            onClick={
              blockExplorerLinkText.firstPart === 'addBlockExplorer'
                ? routeToAddBlockExplorerUrl
                : openBlockExplorer
            }
            target="_blank"
            rel="noopener noreferrer"
            title={
              blockExplorerLinkText.firstPart === 'addBlockExplorer'
                ? t('addBlockExplorer')
                : t('etherscanView')
            }
          >
            {blockExplorerLinkText.firstPart === 'addBlockExplorer'
              ? t('addBlockExplorer')
              : t('viewOnBlockExplorer')}
          </Button>
        </div>
        <Button
          type="primary"
          className="nickname-popover__footer-button"
          onClick={onAddClick}
        >
          {nickname ? t('editANickname') : t('addANickname')}
        </Button>
      </Popover>
    </div>
  );
};

NicknamePopover.propTypes = {
  address: PropTypes.string,
  nickname: PropTypes.string,
  onClose: PropTypes.func,
  onAdd: PropTypes.func,
  explorerLink: PropTypes.string,
};

export default NicknamePopover;
