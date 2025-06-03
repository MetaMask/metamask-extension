import React from 'react';
import { Box } from '../../component-library';
import { TextVariant } from '../../../helpers/constants/design-system';

type AccountDetailsRowProps = {
  label: string;
  value: string;
  endAccessory?: React.ReactNode;
  style?: React.CSSProperties;
};

export const AccountDetailsRow = ({
  label,
  value,
  endAccessory,
  style
}: AccountDetailsRowProps) => {
  return (
    <Box
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        marginBottom: '1px',
        ...style,
      }}
    >
      <span style={{ fontSize: '14px', color: '#6a737d' }}>{label}</span>
      <Box style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{
          fontSize: '14px',
          color: '#24292e',
          marginRight: endAccessory ? '8px' : '0',
        }}>
          {value}
        </span>
        {endAccessory}
      </Box>
    </Box>
  );
};