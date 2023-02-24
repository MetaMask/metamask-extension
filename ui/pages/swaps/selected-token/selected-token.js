import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import {
  Icon,
  ICON_NAMES,
  ICON_SIZES,
} from '../../../components/component-library';
import UrlIcon from '../../../components/ui/url-icon';
import { I18nContext } from '../../../contexts/i18n';

export default function SelectedToken({ onClick, selectedToken }) {
  const t = useContext(I18nContext);
  return (
    <div
      className={classnames(
        'dropdown-search-list',
        'dropdown-search-list__selector-closed-container',
        'dropdown-input-pair__selector--closed',
      )}
      onClick={onClick}
    >
      <div className="dropdown-search-list__selector-closed">
        {selectedToken?.iconUrl && (
          <UrlIcon
            url={selectedToken.iconUrl}
            className="dropdown-search-list__selector-closed-icon"
            name={selectedToken?.symbol}
          />
        )}
        {!selectedToken?.iconUrl && (
          <div className="dropdown-search-list__default-dropdown-icon" />
        )}
        <div className="dropdown-search-list__labels">
          <div className="dropdown-search-list__item-labels">
            <span
              className={classnames(
                'dropdown-search-list__closed-primary-label',
                {
                  'dropdown-search-list__select-default':
                    !selectedToken?.symbol,
                },
              )}
            >
              {selectedToken?.symbol || t('swapSelectAToken')}
            </span>
          </div>
        </div>
      </div>
      <Icon name={ICON_NAMES.ARROW_DOWN} size={ICON_SIZES.XS} marginRight={3} />
    </div>
  );
}

SelectedToken.propTypes = {
  onClick: PropTypes.func.isRequired,
  selectedToken: PropTypes.object.isRequired,
};
