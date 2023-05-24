import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import {
  Icon,
  IconName,
  IconSize,
} from '../../../components/component-library';
import { IconColor } from '../../../helpers/constants/design-system';
import UrlIcon from '../../../components/ui/url-icon';
import { I18nContext } from '../../../contexts/i18n';

export default function SelectedToken({
  onClick,
  onClose,
  selectedToken,
  testId,
}) {
  const t = useContext(I18nContext);
  const hasIcon = selectedToken?.iconUrl && selectedToken?.symbol;

  const onKeyUp = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter') {
      onClick(e);
    }
  };

  return (
    <div
      className={classnames(
        'dropdown-search-list',
        'dropdown-search-list__selector-closed-container',
        'dropdown-input-pair__selector--closed',
      )}
      data-testid="dropdown-search-list"
      tabIndex="0"
      onClick={onClick}
      onKeyUp={onKeyUp}
    >
      <div className="dropdown-search-list__selector-closed">
        {hasIcon && (
          <UrlIcon
            url={selectedToken.iconUrl}
            className="dropdown-search-list__selector-closed-icon"
            name={selectedToken?.symbol}
          />
        )}
        <div
          className={classnames('dropdown-search-list__labels', {
            'dropdown-search-list__labels--with-icon': hasIcon,
          })}
        >
          <div className="dropdown-search-list__item-labels">
            <span
              data-testid={testId}
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
      <Icon
        name={IconName.ArrowDown}
        size={IconSize.Xs}
        marginRight={3}
        color={IconColor.iconAlternative}
      />
    </div>
  );
}

SelectedToken.propTypes = {
  onClick: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  selectedToken: PropTypes.object.isRequired,
  testId: PropTypes.string,
};
