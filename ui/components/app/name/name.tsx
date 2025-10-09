import React, {
  memo,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { NameType } from '@metamask/name-controller';
import { Box, Text } from '../../component-library';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import {
  Display,
  FlexDirection,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useDisplayName } from '../../../hooks/useDisplayName';
import NameDisplay from './name-details/name-display';
import NameDetails from './name-details/name-details';

export type NameProps = {
  /**
   * Applies to recognized contracts with no petname saved:
   * If true the contract symbol (e.g. WBTC) will be used instead of the contract name.
   */
  preferContractSymbol?: boolean;

  /** The type of value, e.g. NameType.ETHEREUM_ADDRESS */
  type: NameType;

  /** The raw value to display the name of. */
  value: string;

  /**
   * The variation of the value.
   * Such as the chain ID if the `type` is an Ethereum address.
   */
  variation: string;
};

const Name = memo(
  ({
    value,
    type,
    preferContractSymbol = false,
    variation,
    ...props
  }: NameProps) => {
    const [modalOpen, setModalOpen] = useState(false);
    const trackEvent = useContext(MetaMetricsContext);

    const { name, subtitle } = useDisplayName({
      value,
      type,
      preferContractSymbol,
      variation,
    });

    useEffect(() => {
      trackEvent({
        event: MetaMetricsEventName.PetnameDisplayed,
        category: MetaMetricsEventCategory.Petnames,
        properties: {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          petname_category: type,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          has_petname: Boolean(name?.length),
        },
      });
      // using `[]` as we only want to call `trackEvent` on the initial render
    }, []);

    const handleClick = useCallback(() => {
      setModalOpen(true);
    }, [setModalOpen]);

    const handleModalClose = useCallback(() => {
      setModalOpen(false);
    }, [setModalOpen]);

    return (
      <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
        {modalOpen && (
          <NameDetails
            value={value}
            type={type}
            variation={variation}
            onClose={handleModalClose}
          />
        )}
        <NameDisplay
          value={value}
          type={type}
          preferContractSymbol={preferContractSymbol}
          variation={variation}
          handleClick={handleClick}
          {...props}
        />
        {subtitle && (
          <Text
            variant={TextVariant.bodySm}
            color={TextColor.textAlternative}
            style={{ textAlign: 'right' }}
          >
            {subtitle}
          </Text>
        )}
      </Box>
    );
  },
);

export default Name;
