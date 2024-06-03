function setupAutoDetectMocking(
  server,
  testAddress = '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
) {
  const nfts = {
    tokens: [
      {
        token: {
          chainId: 1,
          contract: '0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85',
          tokenId:
            '15045599024596508941101550399035548037687903197647023388282056880789326977958',
          kind: 'erc721',
          name: '959555.eth',
          image: 'https://metamask.github.io/test-dapp/metamask-fox.svg',
          imageSmall:
            'https://img.reservoir.tools/images/v2/mainnet/28SsxFrHoAzyiyUIVmrVwlczOlntRxQAii%2B%2F%2BYY7DijjjuiqO6zAjmtHp7iBI3QVnN3esZGCdUn46Xw0Rd4g6Uwm%2BgVVgHquI3sR%2FQkm1Lo%3D?width=250',
          imageLarge:
            'https://img.reservoir.tools/images/v2/mainnet/28SsxFrHoAzyiyUIVmrVwlczOlntRxQAii%2B%2F%2BYY7DijjjuiqO6zAjmtHp7iBI3QVnN3esZGCdUn46Xw0Rd4g6Uwm%2BgVVgHquI3sR%2FQkm1Lo%3D?width=1000',
          description: '959555.eth, an ENS name.',
          rarityScore: null,
          rarityRank: null,
          supply: '1',
          remainingSupply: '1',
          media: null,
          isFlagged: false,
          isSpam: false,
          isNsfw: false,
          metadataDisabled: false,
          lastFlagUpdate: null,
          lastFlagChange: null,
          collection: {
            id: '0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85',
            name: 'ENS: Ethereum Name Service',
            slug: 'ens',
            symbol: null,
            imageUrl: 'https://metamask.github.io/test-dapp/metamask-fox.svg',
            isSpam: false,
            isNsfw: false,
            metadataDisabled: false,
            openseaVerificationStatus: 'verified',
            magicedenVerificationStatus: null,
            floorAskPrice: {
              currency: {
                contract: '0x0000000000000000000000000000000000000000',
                name: 'Ether',
                symbol: 'ETH',
                decimals: 18,
              },
              amount: {
                raw: '890000000000000',
                decimal: 0.00089,
                usd: 2.65981,
                native: 0.00089,
              },
            },
            royaltiesBps: 0,
            royalties: [],
          },
          lastSale: {
            orderSource: null,
            fillSource: null,
            timestamp: 1713213803,
            price: {
              currency: {
                contract: '0x0000000000000000000000000000000000000000',
                name: 'Ether',
                symbol: 'ETH',
                decimals: 18,
              },
              amount: {
                raw: '1300000000000000',
                decimal: 0.0013,
                usd: 4.10499,
                native: 0.0013,
              },
              netAmount: {
                raw: '1287000000000000',
                decimal: 0.00129,
                usd: 4.06394,
                native: 0.00129,
              },
            },
            marketplaceFeeBps: 100,
            paidFullRoyalty: false,
            feeBreakdown: [
              {
                kind: 'marketplace',
                bps: 100,
                recipient: '0xe89b80d335a643495cfcf004037a381565edc130',
                rawAmount: '13000000000000',
                source: 'godid.io',
              },
            ],
          },
          lastAppraisalValue: 0.0013,
          attributes: [
            {
              key: 'Length',
              kind: 'number',
              value: '6',
              tokenCount: 305772,
              onSaleCount: 8506,
              floorAskPrice: {
                currency: {
                  contract: '0x0000000000000000000000000000000000000000',
                  name: 'Ether',
                  symbol: 'ETH',
                  decimals: 18,
                },
                amount: {
                  raw: '400000000000000',
                  decimal: 0.0004,
                  usd: 1.19542,
                  native: 0.0004,
                },
              },
              topBidValue: null,
              createdAt: '2023-03-14T20:09:40.432Z',
            },
            {
              key: 'Segment Length',
              kind: 'number',
              value: '6',
              tokenCount: 247284,
              onSaleCount: 6697,
              floorAskPrice: {
                currency: {
                  contract: '0x0000000000000000000000000000000000000000',
                  name: 'Ether',
                  symbol: 'ETH',
                  decimals: 18,
                },
                amount: {
                  raw: '400000000000000',
                  decimal: 0.0004,
                  usd: 1.19542,
                  native: 0.0004,
                },
              },
              topBidValue: null,
              createdAt: '2023-03-14T20:09:39.928Z',
            },
            {
              key: 'Character Set',
              kind: 'string',
              value: 'digit',
              tokenCount: 263793,
              onSaleCount: 5696,
              floorAskPrice: {
                currency: {
                  contract: '0x0000000000000000000000000000000000000000',
                  name: 'Ether',
                  symbol: 'ETH',
                  decimals: 18,
                },
                amount: {
                  raw: '100000000000000',
                  decimal: 0.0001,
                  usd: 0.29885,
                  native: 0.0001,
                },
              },
              topBidValue: null,
              createdAt: '2023-03-14T20:09:40.046Z',
            },
            {
              key: 'Registration Date',
              kind: 'number',
              value: '1652439936',
              tokenCount: 1,
              onSaleCount: 1,
              floorAskPrice: {
                currency: {
                  contract: '0x0000000000000000000000000000000000000000',
                  name: 'Ether',
                  symbol: 'ETH',
                  decimals: 18,
                },
                amount: {
                  raw: '890000000000000',
                  decimal: 0.00089,
                  usd: 2.65981,
                  native: 0.00089,
                },
              },
              topBidValue: null,
              createdAt: '2023-03-14T20:09:40.300Z',
            },
            {
              key: 'Created Date',
              kind: 'number',
              value: '1652439936',
              tokenCount: 1,
              onSaleCount: 1,
              floorAskPrice: {
                currency: {
                  contract: '0x0000000000000000000000000000000000000000',
                  name: 'Ether',
                  symbol: 'ETH',
                  decimals: 18,
                },
                amount: {
                  raw: '890000000000000',
                  decimal: 0.00089,
                  usd: 2.65981,
                  native: 0.00089,
                },
              },
              topBidValue: null,
              createdAt: '2023-03-14T20:09:40.590Z',
            },
            {
              key: 'Expiration Date',
              kind: 'number',
              value: '1715553840',
              tokenCount: 1,
              onSaleCount: 1,
              floorAskPrice: {
                currency: {
                  contract: '0x0000000000000000000000000000000000000000',
                  name: 'Ether',
                  symbol: 'ETH',
                  decimals: 18,
                },
                amount: {
                  raw: '890000000000000',
                  decimal: 0.00089,
                  usd: 2.65981,
                  native: 0.00089,
                },
              },
              topBidValue: null,
              createdAt: '2023-03-14T20:09:40.725Z',
            },
          ],
          isPhishingDetected: false,
        },
        ownership: {
          tokenCount: '1',
          onSaleCount: '1',
          floorAsk: {
            id: '0xbd11f7221351248cbdc4ddd94248fd049a1e49d56697a41a7487a633514dd560',
            price: {
              currency: {
                contract: '0x0000000000000000000000000000000000000000',
                name: 'Ether',
                symbol: 'ETH',
                decimals: 18,
              },
              amount: {
                raw: '890000000000000',
                decimal: 0.00089,
                usd: 2.65981,
                native: 0.00089,
              },
            },
            maker: '0xb7f3b75088751ae686143827be4d043b91e75855',
            kind: 'seaport-v1.6',
            validFrom: 1714726545,
            validUntil: 1730278528,
            source: {
              id: '0xeb69aa96c4065e69cf04511c8b671906a24e8bae',
              domain: 'okx.com',
              name: 'okx.com',
              icon: 'https://static.coinall.ltd/cdn/assets/imgs/226/EB771F0EE8994DD5.png',
            },
          },
          acquiredAt: '2024-05-03T08:35:11.000Z',
        },
      },
    ],
  };

  const ensTokenResponse = {
    tokens: [
      {
        token: {
          chainId: 1,
          contract: '0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85',
          tokenId:
            '15045599024596508941101550399035548037687903197647023388282056880789326977958',
          name: '959555.eth',
          description: '959555.eth, an ENS name.',
          image:
            'https://img.reservoir.tools/images/v2/mainnet/28SsxFrHoAzyiyUIVmrVwlczOlntRxQAii%2B%2F%2BYY7DijjjuiqO6zAjmtHp7iBI3QVnN3esZGCdUn46Xw0Rd4g6Uwm%2BgVVgHquI3sR%2FQkm1Lo%3D?width=512',
          imageSmall:
            'https://img.reservoir.tools/images/v2/mainnet/28SsxFrHoAzyiyUIVmrVwlczOlntRxQAii%2B%2F%2BYY7DijjjuiqO6zAjmtHp7iBI3QVnN3esZGCdUn46Xw0Rd4g6Uwm%2BgVVgHquI3sR%2FQkm1Lo%3D?width=250',
          imageLarge:
            'https://img.reservoir.tools/images/v2/mainnet/28SsxFrHoAzyiyUIVmrVwlczOlntRxQAii%2B%2F%2BYY7DijjjuiqO6zAjmtHp7iBI3QVnN3esZGCdUn46Xw0Rd4g6Uwm%2BgVVgHquI3sR%2FQkm1Lo%3D?width=1000',
          media: null,
          kind: 'erc721',
          isFlagged: false,
          isSpam: false,
          isNsfw: false,
          metadataDisabled: false,
          lastFlagUpdate: '2023-03-15T03:40:28.454Z',
          lastFlagChange: null,
          supply: '1',
          remainingSupply: '1',
          rarity: null,
          rarityRank: null,
          collection: {
            id: '0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85',
            name: 'ENS: Ethereum Name Service',
            image:
              'https://img.reservoir.tools/images/v2/mainnet/z9JRSpLYGu7%2BCZoKWtAuAHy3YUobqfIRYI750yAWjXOaC3JtQoWDX7cxeYedXo5C8Xjhbxx62jWX%2FlM%2BYhmjb9niMantANf9%2F%2Bi5qEitHoTNuuDbYNNFwncl9jWtDxCl5u7GPWVoM1NOhpvVvnm6hW5Yy6FCf5NBMyjnNlw%2FAr5ENFEwUlYqlx07YuUsHP%2F1?width=250',
            slug: 'ens',
            symbol: null,
            creator: '0x4fe4e666be5752f1fdd210f4ab5de2cc26e3e0e8',
            tokenCount: 3306686,
            metadataDisabled: false,
            floorAskPrice: {
              currency: {
                contract: '0x0000000000000000000000000000000000000000',
                name: 'Ether',
                symbol: 'ETH',
                decimals: 18,
              },
              amount: {
                raw: '890000000000000',
                decimal: 0.00089,
                usd: 2.65981,
                native: 0.00089,
              },
            },
          },
          owner: '0xb7f3b75088751ae686143827be4d043b91e75855',
          decimals: null,
          mintStages: [],
          isPhishingDetected: false,
        },
        market: {
          floorAsk: {
            id: '0xbd11f7221351248cbdc4ddd94248fd049a1e49d56697a41a7487a633514dd560',
            price: {
              currency: {
                contract: '0x0000000000000000000000000000000000000000',
                name: 'Ether',
                symbol: 'ETH',
                decimals: 18,
              },
              amount: {
                raw: '890000000000000',
                decimal: 0.00089,
                usd: 2.65981,
                native: 0.00089,
              },
            },
            maker: '0xb7f3b75088751ae686143827be4d043b91e75855',
            validFrom: 1714726545,
            validUntil: 1730278528,
            source: {
              id: '0xeb69aa96c4065e69cf04511c8b671906a24e8bae',
              domain: 'okx.com',
              name: 'okx.com',
              icon: 'https://static.coinall.ltd/cdn/assets/imgs/226/EB771F0EE8994DD5.png',
            },
          },
        },
        updatedAt: '2024-05-03T08:56:30.923Z',
      },
    ],
    continuation: null,
  };

  // Get assets for account
  server
    .forGet(`https://nft.api.cx.metamask.io/users/${testAddress}/tokens`)
    .withQuery({
      limit: 50,
      includeTopBid: true,
      chainIds: '1',
      continuation: '',
    })
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: nfts,
      };
    });

  // Get contract
  const ENS_ADDRESS = '0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85';
  const ENS_ID =
    '15045599024596508941101550399035548037687903197647023388282056880789326977958';
  server
    .forGet('https://nft.api.cx.metamask.io/tokens')
    .withQuery({
      chainIds: '1',
      tokens: `${ENS_ADDRESS}:${ENS_ID}`,
      includeTopBid: 'true',
      includeAttributes: 'true',
      includeLastSale: 'true',
    })
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: ensTokenResponse,
      };
    });

  // eth_blockNumber
  server
    .forPost('/v3/00000000000000000000000000000000')
    .withBodyIncluding('eth_blockNumber')
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: 1111111111111111,
          result: '0x1',
        },
      };
    });

  // eth_getBlockByNumber
  server
    .forPost('/v3/00000000000000000000000000000000')
    .withBodyIncluding('eth_getBlockByNumber')
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: 1111111111111111,
          result: {},
        },
      };
    });

  // eth_call
  server
    .forPost('/v3/00000000000000000000000000000000')
    .withBodyIncluding('eth_call')
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: 1111111111111111,
          result: '0x1',
        },
      };
    });
}

module.exports = {
  setupAutoDetectMocking,
};
