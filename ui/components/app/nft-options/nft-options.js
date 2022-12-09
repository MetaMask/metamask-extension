import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';

import { I18nContext } from '../../../contexts/i18n';
import { Menu, MenuItem } from '../../ui/menu';

const NftOptions = ({ onRemove, onViewOnOpensea }) => {
  const t = useContext(I18nContext);
  const [nftOptionsButtonElement, setNftOptionsButtonElement] = useState(null);
  const [nftOptionsOpen, setNftOptionsOpen] = useState(false);

  return (
    <>
      <button
        className="fas fa-ellipsis-v nft-options__button"
        data-testid="nft-options__button"
        onClick={() => setNftOptionsOpen(true)}
        ref={setNftOptionsButtonElement}
      />
      {nftOptionsOpen ? (
        <Menu
          anchorElement={nftOptionsButtonElement}
          onHide={() => setNftOptionsOpen(false)}
        >
          {onViewOnOpensea ? (
            <MenuItem
              iconClassName="fas fa-qrcode"
              data-testid="nft-options__view-on-opensea"
              onClick={() => {
                setNftOptionsOpen(false);
                onViewOnOpensea();
              }}
            >
              {t('viewOnOpensea')}
            </MenuItem>
          ) : null}
          <MenuItem
            iconClassName="fas fa-trash-alt nft-options__icon"
            data-testid="nft-options__hide"
            onClick={() => {
              setNftOptionsOpen(false);
              onRemove();
            }}
          >
            {t('removeNFT')}
          </MenuItem>
        </Menu>
      ) : null}
    </>
  );
};

NftOptions.propTypes = {
  onRemove: PropTypes.func.isRequired,
  onViewOnOpensea: PropTypes.func.isRequired,
};

export default NftOptions;
