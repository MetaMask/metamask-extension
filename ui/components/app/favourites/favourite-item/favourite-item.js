import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { AvatarFavicon } from '../../../component-library/avatar-favicon';
import { IconName, IconSize, Icon } from '../../../component-library';
import IconButton from '../../../ui/icon-button';
import { Size } from '../../../../helpers/constants/design-system';

const FavouriteItem = ({
  favIconUrl,
  href,
  onClick,
  showFavouriteNumbers,
  num,
  className = '',
  deleteMode = false,
}) => {
  const hrefWithoutProtocol = href.replace(/^(https?|http):\/\//u, '');
  return (
    <div className="favourite-item-wrapper">
      {showFavouriteNumbers && !deleteMode ? (
        <div className="favourite-number">{num}</div>
      ) : null}
      {deleteMode ? (
        <div className="favourite-item__delete-icon">
          <Icon name={IconName.Trash} size={IconSize.Sm} />
        </div>
      ) : null}
      <IconButton
        className={classnames('favourite-item', className)}
        Icon={
          <AvatarFavicon
            className="connected-sites-list__subject-icon"
            name={hrefWithoutProtocol}
            size={Size.MD}
            src={favIconUrl}
          />
        }
        label={hrefWithoutProtocol}
        onClick={() => onClick(href)}
      />
    </div>
  );
};

FavouriteItem.propTypes = {
  favIconUrl: PropTypes.string,
  href: PropTypes.string,
  onClick: PropTypes.func,
  showFavouriteNumbers: PropTypes.bool,
  num: PropTypes.number,
  className: PropTypes.string,
  deleteMode: PropTypes.bool,
};

export default FavouriteItem;
