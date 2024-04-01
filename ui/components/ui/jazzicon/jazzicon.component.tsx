import React, { useEffect, useRef } from 'react';
import jazzicon from '@metamask/jazzicon';
import iconFactoryGenerator from '../../../helpers/utils/icon-factory';

const iconFactory = iconFactoryGenerator(jazzicon);

/**
 * Renders a Jazzicon component based on the provided address. Utilizes a React ref to manage the DOM element for the icon.
 *
 * @param props - The component props.
 * @param props.address - The blockchain address to generate the icon for.
 * @param props.className - Optional. Additional CSS classes to apply to the container div.
 * @param props.diameter - Optional. The diameter of the icon. Defaults to 46 pixels.
 * @param props.style - Optional. Inline styles for the container div.
 * @param props.tokenList - Optional. An object mapping addresses to token metadata, used to optionally override Jazzicon with specific icons.
 * @returns A React component displaying a Jazzicon or custom icon.
 */
function Jazzicon({
  address,
  className,
  diameter = 46,
  style,
  tokenList = {},
}: {
  address: string;
  className?: string;
  diameter?: number;
  style?: React.CSSProperties;
  tokenList?: { [address: string]: { iconUrl?: string } };
}) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) {
      // eslint-disable-next-line consistent-return
      return;
    }

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
