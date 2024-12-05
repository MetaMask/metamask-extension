import React from 'react';
import { Box } from '../../component-library';
import {
  AccountOverviewTabsProps,
  AccountOverviewTabs,
} from './account-overview-tabs';

export type AccountOverviewLayoutProps = AccountOverviewTabsProps & {
  children: React.ReactElement;
};

export const AccountOverviewLayout = ({
  children,
  ...tabsProps
}: AccountOverviewLayoutProps) => {
  return (
    <>
      <div className="account-overview__balance-wrapper">{children}</div>
      <Carousel />
      <AccountOverviewTabs {...tabsProps}></AccountOverviewTabs>
    </>
  );
};

function Carousel() {
  return (
    <Box
      style={{
        height: '89px',
        padding: '0 16px',
      }}
    >
      <CarouselSlide />
      <Box
        style={{
          height: '30px',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}
      >
        <Box
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#848C96',
          }}
        />
        <Box
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: 'white',
          }}
        />
        <Box
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#848C96',
          }}
        />
      </Box>
    </Box>
  );
}

function CarouselSlide() {
  return (
    <Box
      style={{
        height: '59px',
        backgroundColor: '#2E3033',
        border: '1px solid #858B9A33',
        borderRadius: '8px',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <Box
        style={{
          backgroundColor: 'red',
          position: 'absolute',
          left: '5px',
          top: '0',
          height: '61px',
          width: '60px',
        }}
      />
      <Box
        style={{
          position: 'absolute',
          left: '80px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '12px 0',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontSize: '14px',
            fontWeight: '500',
          }}
        >
          Lorem ipsum
        </span>
        <span
          style={{
            fontSize: '12px',
            fontWeight: '400',
          }}
        >
          Dolor sit amet, consectetur
        </span>
      </Box>
      <Box
        style={{
          position: 'absolute',
          top: '12px',
          right: '16px',
          width: '24px',
          height: '24px',
          backgroundColor: 'red',
        }}
      />
    </Box>
  );
}
