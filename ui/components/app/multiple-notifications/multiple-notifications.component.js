import React, { memo, useState } from 'react';
import classnames from 'clsx';
import PropTypes from 'prop-types';

function MultipleNotifications({ children = [], classNames = [] }) {
  const [showAll, setShowAll] = useState(false);

  const childrenToRender = children.filter(Boolean);
  if (childrenToRender.length === 0) {
    return null;
  }

  return (
    <div
      className={classnames(
        ...classNames,
        'home-notification-wrapper--multichain',
        {
          'home-notification-wrapper--show-all': showAll,
          'home-notification-wrapper--show-first': !showAll,
        },
      )}
    >
      {childrenToRender}
      <div
        className="home-notification-wrapper__i-container"
        onClick={() => setShowAll((current) => !current)}
      >
        {childrenToRender.length > 1 ? (
          <i
            className={classnames('fa fa-sm fa-sort-amount', {
              flipped: !showAll,
            })}
          />
        ) : null}
      </div>
    </div>
  );
}

MultipleNotifications.propTypes = {
  children: PropTypes.array,
  classNames: PropTypes.array,
};

export default memo(MultipleNotifications);
