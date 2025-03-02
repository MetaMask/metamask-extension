import React, { memo } from 'react';
import classnames from 'classnames';
import { NameType } from '@metamask/name-controller';
import Identicon from '../../../ui/identicon';
import { Icon, IconName, IconSize } from '../../../component-library';
import { useDisplayName } from '../../../../hooks/useDisplayName';
import ShortenedName from './shortened-name';
import FormattedName from './formatted-value';

export type NameDisplayProps = {
  preferContractSymbol?: boolean;
  value: string;
  type: NameType;
  variation: string;
  handleClick?: () => void;
};

function doesHaveDisplayName(name: string | null): name is string {
  return Boolean(name);
}

const NameDisplay = memo(
  ({
    value,
    type,
    preferContractSymbol,
    variation,
    handleClick,
  }: NameDisplayProps) => {
    const { name, hasPetname, image } = useDisplayName({
      value,
      type,
      preferContractSymbol,
      variation,
    });

    const hasDisplayName = doesHaveDisplayName(name);

    return (
      <div
        className={classnames({
          name: true,
          name__clickable: Boolean(handleClick),
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
          <ShortenedName name={name} />
        ) : (
          <FormattedName value={value} type={type} />
        )}
      </div>
    );
  },
);

export default NameDisplay;
