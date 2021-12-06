import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

const Disclosure = ({ children, title, size }) => {
  return (
    <div className="disclosure disclosure--no-margin">
      {title ? (
        <details classNmae="disclosure__details">
          <summary className="disclosure__details--summary">{title}: </summary>
          <div className={classnames('disclosure__content', size)}>
            {children}
          </div>
          <div className="disclosure__footer"></div>
        </details>
      ) : (
        children
      )}
    </div>
  );
};

Disclosure.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  size: PropTypes.string,
};

Disclosure.defaultProps = {
  size: 'normal',
  title: null,
};

export default Disclosure;
