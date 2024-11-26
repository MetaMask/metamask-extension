import React, {
  memo,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { NameType } from '@metamask/name-controller';
import classnames from 'classnames';
import { toChecksumAddress } from 'ethereumjs-util';
import { Box, Icon, IconName, IconSize, Text } from '../../component-library';
import { shortenAddress, shortenString } from '../../../helpers/utils/util';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { Display, TextVariant } from '../../../helpers/constants/design-system';
import { useDisplayName } from '../../../hooks/useDisplayName';
import Identicon from '../../ui/identicon';
import NameDetails from './name-details/name-details';

export type NameProps = {
  /** Whether to prevent the modal from opening when the component is clicked. */
  disableEdit?: boolean;

  /** Whether this is being rendered inside the NameDetails modal. */
  internal?: boolean;

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

function formatValue(value: string, type: NameType): string {
  if (!value.length) {
    return value;
  }

  switch (type) {
    case NameType.ETHEREUM_ADDRESS:
      return shortenAddress(toChecksumAddress(value));

    default:
      return value;
  }
}

const Name = memo(
  ({
    value,
    type,
    disableEdit,
    internal,
    preferContractSymbol = false,
    variation,
  }: NameProps) => {
    const [modalOpen, setModalOpen] = useState(false);
    const trackEvent = useContext(MetaMetricsContext);

    const { name, hasPetname, image } = useDisplayName({
      value,
      type,
      preferContractSymbol,
      variation,
    });

    useEffect(() => {
      if (internal) {
        return;
      }

      trackEvent({
        event: MetaMetricsEventName.PetnameDisplayed,
        category: MetaMetricsEventCategory.Petnames,
        properties: {
          petname_category: type,
          has_petname: Boolean(name?.length),
        },
      });
    }, []);

    const handleClick = useCallback(() => {
      setModalOpen(true);
    }, [setModalOpen]);

    const handleModalClose = useCallback(() => {
      setModalOpen(false);
    }, [setModalOpen]);

    const formattedValue = formatValue(value, type);
    const MAX_PET_NAME_LENGTH = 12;
    const formattedName = shortenString(name || undefined, {
      truncatedCharLimit: MAX_PET_NAME_LENGTH,
      truncatedStartChars: MAX_PET_NAME_LENGTH,
      truncatedEndChars: 0,
      skipCharacterInEnd: true,
    });
    const hasDisplayName = Boolean(name);

    return (
      <Box display={Display.Flex}>
        {!disableEdit && modalOpen && (
          <NameDetails
            value={value}
            type={type}
            variation={variation}
            onClose={handleModalClose}
          />
        )}
        <div
          className={classnames({
            name: true,
            name__saved: hasPetname,
            name__recognized_unsaved: !hasPetname && hasDisplayName,
            name__missing: !hasDisplayName,
          })}
          onClick={handleClick}
        >
          {hasDisplayName ? (
            <Identicon address={value} diameter={16} image={image} />
          ) : (
            <Icon
              name={IconName.Question}
              className="name__icon"
              size={IconSize.Md}
            />
          )}
          {hasDisplayName ? (
            <Text className="name__name" variant={TextVariant.bodyMd}>
              {formattedName}
            </Text>
          ) : (
            <Text className="name__value" variant={TextVariant.bodyMd}>
              {formattedValue}
            </Text>
          )}
        </div>
      </Box>
    );
  },
);

export default Name;
