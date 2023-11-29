import React from 'react';
import PropTypes from 'prop-types';
import { AvatarFavicon } from '../../../component-library/avatar-favicon';
import IconButton from '../../../ui/icon-button';
import { Size } from '../../../../helpers/constants/design-system';

const FavouriteItem = ({
  favIconUrl,
  href,
  onClick,
  showFavouriteNumbers,
  num,
}) => {
  const hrefWithoutProtocol = href.replace(/^(https?|http):\/\//u, '');
  return (
    <div className="favourite-item-wrapper">
      {showFavouriteNumbers ? (
        <div className="favourite-number">{num}</div>
      ) : null}
      <IconButton
        className="favourite-item"
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
};

export default FavouriteItem;
