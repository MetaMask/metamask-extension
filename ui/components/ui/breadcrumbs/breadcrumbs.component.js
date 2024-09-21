import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

export default class Breadcrumbs extends PureComponent {
  static propTypes = {
    className: PropTypes.string,
    currentIndex: PropTypes.number,
    total: PropTypes.number,
  };

  render() {
    const { className, currentIndex, total } = this.props;

    return (
      <div className={classnames('breadcrumbs', className)}>
        {Array(total)
          .fill()
          .map((_, i) => (
            <div
              key={i}
              className="breadcrumb"
              style={{
                backgroundColor:
                  i === currentIndex
                    ? 'var(--color-background-alternative)'
                    : 'var(--color-background-default)',
              }}
            />
          ))}
      </div>
    );
  }
}
