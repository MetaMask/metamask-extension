import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import jazzicon from '@metamask/jazzicon';
import { stringToBytes } from '@metamask/utils';
import iconFactoryGenerator, {
  IconFactory,
} from '../../../helpers/utils/icon-factory';

// Our existing seed generation for Ethereum addresses does not work with arbitrary string inputs.
// Since it assumes the address can be parsed as hexadecimal, however that assumption does not hold for all multichain addresses.
// Therefore we choose to use a byte array as the seed for multichain addresses.
// This works since the underlying Mersenne Twister PRNG can be seeded with an array as well.
function generateSeed(address) {
  return Array.from(stringToBytes(address.normalize('NFKC').toLowerCase()));
}

const ethereumIconFactory = iconFactoryGenerator(jazzicon);
const multichainIconFactory = new IconFactory(jazzicon, generateSeed);

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
  namespace = 'eip155',
}) {
  const container = useRef();

  useEffect(() => {
    const _container = container.current;

    const iconFactory =
      namespace === 'eip155' ? ethereumIconFactory : multichainIconFactory;

    // add icon
    const imageNode = iconFactory.iconForAddress(
      address,
      diameter,
      tokenList[address?.toLowerCase()],
    );

    _container?.appendChild(imageNode);

    // remove icon
    return () => {
      while (_container.firstChild) {
        _container.firstChild.remove();
      }
    };
  }, [address, diameter, tokenList]);

  return <div ref={container} className={className} style={style} />;
}

Jazzicon.propTypes = {
  /**
   * Address used for generating random image
   */
  address: PropTypes.string.isRequired,
  /**
   * Add custom css class
   */
  className: PropTypes.string,
  /**
   * Sets the width and height of the inner img element
   * Jazzicon accepts a pixel diameter
   */
  diameter: PropTypes.number,
  /**
   * Add inline style for the component
   */
  style: PropTypes.object,
  /**
   * Add list of token in object
   */
  tokenList: PropTypes.object,
  /**
   * Must be a CAIP-10 namespace, defaults to eip155 (EVM).
   */
  namespace: PropTypes.string,
};

export default Jazzicon;
