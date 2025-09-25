import React, { useEffect, useRef, useState } from "react";
import { Button, ButtonVariant, ButtonSize, Icon, IconName } from "../../../components/component-library";
import { AlignItems, JustifyContent } from "../../../helpers/constants/design-system";
import { Column, Row } from "../layout";
import { NetworkFilterPill } from "./network-filter-pill";
import { NETWORK_TO_SHORT_NETWORK_NAME_MAP } from "../../../../shared/constants/bridge";
import { getImageForChainId } from '../../confirmations/utils/network';
import { SUPPORTED_NETWORKS } from "../utils/assets-service";

interface NetworkCarouselProps {
  selectedNetwork: string | null;
  setSelectedNetwork: (network: string | null) => void;
}

const NETWORK_PILLS = SUPPORTED_NETWORKS.map((network) => ({
  id: network,
  name: NETWORK_TO_SHORT_NETWORK_NAME_MAP[network],
  image: getImageForChainId(network),
}));

export const NetworkCarousel = ({ selectedNetwork, setSelectedNetwork }: NetworkCarouselProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth);
    }
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    updateScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', updateScrollButtons);
      return () => container.removeEventListener('scroll', updateScrollButtons);
    }
  }, []);

  return (
    <Column gap={2} paddingLeft={4} paddingRight={4}>
      <Row justifyContent={JustifyContent.spaceBetween}>
        <Row alignItems={AlignItems.center} gap={2}>
          <Button
            variant={ButtonVariant.Link}
            size={ButtonSize.Sm}
            onClick={scrollLeft}
            disabled={!canScrollLeft}
          >
            <Icon name={IconName.ArrowLeft} />
          </Button>

          <div
            style={{
              overflow: 'hidden',
              flex: 1,
              maxWidth: '300px',
              display: 'flex',
              gap: '8px'
            }}
            ref={scrollContainerRef}
          >
            <div style={{display: 'flex', gap: "8px", maxWidth: "max-content"}}>
              <NetworkFilterPill
                selected={selectedNetwork === null}
                network={null}
                onSelect={() => setSelectedNetwork(null)}
              />
              {NETWORK_PILLS.map((network) => (
                <NetworkFilterPill
                  key={network.id}
                  selected={selectedNetwork === network.id}
                  network={network}
                  onSelect={(networkId) => setSelectedNetwork(networkId)}
                />
              ))}
            </div>
          </div>

          <Button
            variant={ButtonVariant.Link}
            size={ButtonSize.Sm}
            onClick={scrollRight}
            disabled={!canScrollRight}
          >
            <Icon name={IconName.ArrowRight} />
          </Button>
        </Row>
      </Row>
    </Column>
  )
}
