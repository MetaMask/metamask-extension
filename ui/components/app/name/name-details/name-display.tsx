import type { NameType } from '@metamask/name-controller';
import classnames from 'classnames';
import React, { memo } from 'react';

import { useDisplayName } from '../../../../hooks/useDisplayName';
import { Icon, IconName, IconSize } from '../../../component-library';
import Identicon from '../../../ui/identicon';
import FormattedName from './formatted-value';
import ShortenedName from './shortened-name';

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
