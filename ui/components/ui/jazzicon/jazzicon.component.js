import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import jazzicon from '@metamask/jazzicon';
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
  const image = useMemo(() => {
    const imageNode = iconFactory.iconForAddress(
      address,
      diameter,
      tokenList[address.toLowerCase()],
    );

    return imageNode.outerHTML;
  }, [address, diameter, tokenList]);

  return (
    <div
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: image }}
    />
  );
}

Jazzicon.propTypes = {
  address: PropTypes.string.isRequired,
  className: PropTypes.string,
  diameter: PropTypes.number,
  style: PropTypes.object,
  tokenList: PropTypes.object,
};

export default Jazzicon;
