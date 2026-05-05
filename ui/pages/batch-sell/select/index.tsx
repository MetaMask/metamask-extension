import React from 'react';
import { AssetList } from './components/AssetList';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { NetworkToolbar } from './components/NetworkToolbar';
import { SortingToolbar } from './components/SortingToolbar';

export const BatchSellSelectPage = () => {
  return (
    <div>
      <Header />
      <NetworkToolbar />
      <SortingToolbar />
      <AssetList />
      <Footer />
    </div>
  );
};
