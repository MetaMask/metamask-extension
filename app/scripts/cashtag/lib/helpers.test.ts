import browser from 'webextension-polyfill';
import { CHAIN_IDS } from '#shared/constants/chain-ids';
import {
  MultichainNetworks,
  SOLANA_TOKEN_IMAGE_URL,
} from '#shared/constants/multichain/networks';
import { ETH_TOKEN_IMAGE_URL } from '#shared/constants/network';
import {
  findCashtagAnchors,
  getChainImageUrl,
  symbolFromCashtagAnchor,
} from './helpers';

function extensionUrl(relativePath: string) {
  return `chrome-extension://test/${relativePath.replace(/^\.\//u, '')}`;
}

function makeCashtagAnchor(href: string, text = '') {
  const anchor = document.createElement('a');
  anchor.setAttribute('href', href);
  anchor.textContent = text;
  return anchor;
}

describe('symbolFromCashtagAnchor', () => {
  it('reads the ticker from an encoded cashtag search href', () => {
    const anchor = makeCashtagAnchor(
      '/search?q=%24BTC&src=cashtag_click',
      '$BTC',
    );

    expect(symbolFromCashtagAnchor(anchor)).toBe('BTC');
  });

  it('reads the ticker from a decoded $ cashtag search href', () => {
    const anchor = makeCashtagAnchor(
      '/search?q=$ETH&src=cashtag_click',
      '$eth',
    );

    expect(symbolFromCashtagAnchor(anchor)).toBe('ETH');
  });

  it('falls back to link text when the href has no cashtag query', () => {
    const anchor = makeCashtagAnchor('/search?src=cashtag_click', '$sol');

    expect(symbolFromCashtagAnchor(anchor)).toBe('SOL');
  });
});

describe('findCashtagAnchors', () => {
  it('returns cashtag anchors inside tweets with their symbols', () => {
    const root = document.createElement('div');
    root.innerHTML = `
      <article data-testid="tweet">
        <a href="/search?q=%24BTC&src=cashtag_click">$BTC</a>
        <a href="/search?q=$ETH&src=cashtag_click">$ETH</a>
      </article>
      <a href="/search?q=%24DOGE&src=cashtag_click">$DOGE</a>
    `;

    const found = findCashtagAnchors(root);

    expect(found.map(({ symbol }) => symbol)).toEqual(['BTC', 'ETH']);
    expect(
      found.every(({ element }) => element instanceof HTMLAnchorElement),
    ).toBe(true);
  });

  it('skips cashtag-looking links that are not cashtag_click search links', () => {
    const root = document.createElement('div');
    root.innerHTML = `
      <article data-testid="tweet">
        <a href="/search?q=%24BTC">$BTC</a>
        <a href="/home">$BTC</a>
      </article>
    `;

    expect(findCashtagAnchors(root)).toEqual([]);
  });
});

describe('getChainImageUrl', () => {
  beforeEach(() => {
    Object.assign(browser.runtime, {
      getURL: (path: string) => `chrome-extension://test/${path}`,
    });
  });

  it('returns null when chainId is missing', () => {
    expect(getChainImageUrl(null)).toBeNull();
    expect(getChainImageUrl(undefined)).toBeNull();
    expect(getChainImageUrl('')).toBeNull();
  });

  it('maps a hex EVM chain id to an extension image URL', () => {
    expect(getChainImageUrl(CHAIN_IDS.MAINNET)).toBe(
      extensionUrl(ETH_TOKEN_IMAGE_URL),
    );
  });

  it('maps an EVM CAIP chain id through the hex image map', () => {
    expect(getChainImageUrl('eip155:1')).toBe(
      extensionUrl(ETH_TOKEN_IMAGE_URL),
    );
  });

  it('maps a multichain CAIP chain id to an extension image URL', () => {
    expect(getChainImageUrl(MultichainNetworks.SOLANA)).toBe(
      extensionUrl(SOLANA_TOKEN_IMAGE_URL),
    );
  });

  it('returns null for an unknown chain id', () => {
    expect(getChainImageUrl('eip155:999999')).toBeNull();
  });
});
