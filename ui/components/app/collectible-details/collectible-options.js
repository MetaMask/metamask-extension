import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';

import { I18nContext } from '../../../contexts/i18n';
import { Menu, MenuItem } from '../../../components/ui/menu';

const CollectibleOptions = ({
  onRemove,
  onReportAsScam,
  onViewOnOpensea,
}) => {
  const t = useContext(I18nContext);
  const [
    collectibleOptionsButtonElement,
    setCollectibleOptionsButtonElement,
  ] = useState(null);
  const [collectibleOptionsOpen, setCollectibleOptionsOpen] = useState(false);

  return (
    <>
      <button
        className="fas fa-ellipsis-v collectible-options__button"
        data-testid="collectible-options__button"
        onClick={() => setCollectibleOptionsOpen(true)}
        ref={setCollectibleOptionsButtonElement}
        title={t('collectibleOptions')}
      />
      {collectibleOptionsOpen ? (
        <Menu
          anchorElement={collectibleOptionsButtonElement}
          onHide={() => setCollectibleOptionsOpen(false)}
        >
          <MenuItem
            iconClassName="fas fa-qrcode"
            data-testid="collectible-options__view-on-opensea"
            onClick={() => {
              setCollectibleOptionsOpen(false);
              onViewOnOpensea();
            }}
          >
            {t('accountDetails')}
          </MenuItem>
          <MenuItem
            iconClassName="fas fa-external-link-alt collectible-options__icon"
            data-testid="collectible-options__etherscan"
            onClick={() => {
              setCollectibleOptionsOpen(false);
              onReportAsScam();
            }}
          >
            {t('reportAsScam')}
          </MenuItem>
          <MenuItem
            iconClassName="fas fa-trash-alt collectible-options__icon"
            data-testid="collectible-options__hide"
            onClick={() => {
              setCollectibleOptionsOpen(false);
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

CollectibleOptions.propTypes = {
  onRemove: PropTypes.func.isRequired,
  onReportAsScam: PropTypes.func.isRequired,
  onViewOnOpensea: PropTypes.func.isRequired,
};

export default CollectibleOptions;
