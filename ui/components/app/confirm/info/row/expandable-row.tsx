import React, { useCallback, useRef, useState } from 'react';
import classnames from 'classnames';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '../../../../component-library';
import { Display } from '../../../../../helpers/constants/design-system';
import { ConfirmInfoRow, ConfirmInfoRowProps } from './row';

export type ConfirmInfoExpandableRowProps = ConfirmInfoRowProps & {
  content: React.ReactNode | string;
  startExpanded?: boolean;
};

export const ConfirmInfoExpandableRow = (
  props: ConfirmInfoExpandableRowProps,
) => {
  const { content, children, startExpanded, ...rowProps } = props;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ref = useRef<any>();

  const [expanded, setExpanded] = useState<boolean>(Boolean(startExpanded));

  const handleClick = useCallback(() => {
    setExpanded(!expanded);
  }, [expanded]);

  return (
    <>
      <ConfirmInfoRow {...rowProps}>
        <Box display={Display.Flex}>
          {children}
          <ButtonIcon
            marginLeft={1}
            className={classnames({
              expandIcon: true,
              expanded,
            })}
            iconName={IconName.ArrowLeft}
            size={ButtonIconSize.Sm}
            onClick={handleClick}
            ariaLabel="expand"
          />
        </Box>
      </ConfirmInfoRow>
      <Box
        ref={ref}
        className="expandable"
        style={{
          height: expanded ? ref.current?.scrollHeight : '0px',
        }}
      >
        <Box style={{ marginTop: '-8px' }}>{content}</Box>
      </Box>
    </>
  );
};
