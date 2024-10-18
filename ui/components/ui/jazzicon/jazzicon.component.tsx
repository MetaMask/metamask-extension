import React, { useEffect, useRef } from 'react';
import jazzicon from '@metamask/jazzicon';
import { stringToBytes } from '@metamask/utils';
import iconFactoryGenerator, {
  IconFactory,
} from '../../../helpers/utils/icon-factory';

/**
 * Generates a seed for Jazzicon based on the provided address.
 *
 * Our existing seed generation for Ethereum addresses does not work with
 * arbitrary string inputs. Since it assumes the address can be parsed as
 * hexadecimal, however that assumption does not hold for all multichain
 * addresses. Therefore we choose to use a byte array as the seed for multichain
 * addresses. This works since the underlying Mersenne Twister PRNG can be
 * seeded with an array as well.
 *
 * @param address - The blockchain address to generate the seed for.
 * @returns The seed for Jazzicon.
 */
function generateSeed(address: string) {
  return Array.from(stringToBytes(address.normalize('NFKC').toLowerCase()));
}

const ethereumIconFactory = iconFactoryGenerator(jazzicon);
const multichainIconFactory = new IconFactory(jazzicon, generateSeed);

/**
 * Renders a Jazzicon component based on the provided address. Utilizes a React ref to manage the DOM element for the icon.
 *
 * @param props - The component props.
 * @param props.address - The blockchain address to generate the icon for.
 * @param props.className - Optional. Additional CSS classes to apply to the container div.
 * @param props.diameter - Optional. The diameter of the icon. Defaults to 46 pixels.
 * @param props.style - Optional. Inline styles for the container div.
 * @param props.tokenList - Optional. An object mapping addresses to token metadata, used to optionally override Jazzicon with specific icons.
 * @param props.namespace - Optional. The namespace to use for the seed generation. Defaults to 'eip155'.
 * @returns A React component displaying a Jazzicon or custom icon.
 */
function Jazzicon({
  address,
  className,
  diameter = 46,
  style,
  tokenList = {},
  namespace = 'eip155',
}: {
  address: string;
  className?: string;
  diameter?: number;
  style?: React.CSSProperties;
  tokenList?: { [address: string]: { iconUrl?: string } };
  namespace?: string;
}) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) {
      // eslint-disable-next-line consistent-return
      return;
    }

    const iconFactory =
      namespace === 'eip155' ? ethereumIconFactory : multichainIconFactory;

    const imageNode = iconFactory.iconForAddress(
      address,
      diameter,
      tokenList[address?.toLowerCase()],
    );

    container.current.appendChild(imageNode);

    // Clean-up function to remove the icon from the DOM
    // eslint-disable-next-line consistent-return
    return () => {
      while (container.current?.firstChild) {
        container.current.firstChild.remove();
      }
    };
  }, [address, diameter, tokenList]);

  return <div ref={container} className={className} style={style} />;
}

export default Jazzicon;
