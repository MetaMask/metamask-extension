import classnames from 'classnames';
import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
import { usePrevious } from '../../../hooks/usePrevious';
import { MILLISECOND } from '../../../../shared/constants/time';

function Alert(props) {
  const [visible, setVisible] = useState(false);
  const [className, setClassName] = useState('');
  const lastVisible = usePrevious(props.visible);

  useEffect(() => {
    const animateIn = () => {
      setClassName('visible');
      setVisible(true);
    };

    const animateOut = () => {
      setClassName('hidden');

      setTimeout((_) => {
        setVisible(false);
      }, MILLISECOND * 500);
    };

    if (!lastVisible && props.visible) {
      animateIn(props.msg);
    } else if (lastVisible && !props.visible) {
      animateOut();
    }
  }, [lastVisible, props.msg, props.visible]);

  if (!visible) {
    return null;
  }

  return (
    <div className={classnames('global-alert', className)}>
      <a className="msg">{props.msg}</a>
    </div>
  );
}

Alert.propTypes = {
  visible: PropTypes.bool.isRequired,
  msg: PropTypes.string,
};

export default Alert;
