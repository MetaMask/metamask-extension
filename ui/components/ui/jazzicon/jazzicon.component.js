import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import jazzicon from '@metamask/jazzicon';
import { usePrevious } from '../../../hooks/usePrevious';
import iconFactoryGenerator from '../../../helpers/utils/icon-factory';

const iconFactory = iconFactoryGenerator(jazzicon);

/**
 * Wrapper around the jazzicon library to return a React component, as the library returns an
 * HTMLDivElement which needs to be appended.
 */

function Jazzicon({
  address,
  className,
  diameter = 46,
  style,
  tokenList = {},
}) {
  const container = useRef();
  const prevAddress = usePrevious(address);
  const prevDiameter = usePrevious(diameter);

  useEffect(() => {
    const removeExistingChildren = () => {
      const { children } = container.current;

      for (let i = 0; i < children.length; i++) {
        container.current.removeChild(children[i]);
      }
    };

    const appendJazzicon = () => {
      const image = iconFactory.iconForAddress(
        address,
        diameter,
        tokenList[address.toLowerCase()],
      );
      container.current.appendChild(image);
    };

    appendJazzicon();

    if (address !== prevAddress || diameter !== prevDiameter) {
      removeExistingChildren();
      appendJazzicon();
    }
  }, [prevAddress, prevDiameter, address, diameter, tokenList]);

  return <div className={className} ref={container} style={style} />;
}

Jazzicon.propTypes = {
  address: PropTypes.string.isRequired,
  className: PropTypes.string,
  diameter: PropTypes.number,
  style: PropTypes.object,
  tokenList: PropTypes.object,
};

export default Jazzicon;
