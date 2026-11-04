import { subscribeToMessengerEvent } from "../../store/background-connection";
import {
  applyLiveTokenFiat,
  getLiveAssetPriceSnapshot,
  ingestMarketStatsPrices,
  ingestPriceChanged,
  liveFiatDelta,
  subscribeLiveAssetPrices,
} from "./live-asset-prices";

jest.mock("../../store/background-connection", () => ({
  subscribeToMessengerEvent: jest.fn(),
  submitRequestToBackground: jest.fn(),
}));

const subscribeToMessengerEventMock = jest.mocked(subscribeToMessengerEvent);

describe("ingestPriceChanged", () => {
  it("stores the streamed price under the lowercased EVM id", () => {
    ingestPriceChanged([
      {
        prices: {
          "eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48": {
            price: 1.01,
            pricePercentChange1d: 0.4,
            assetPriceType: "fungible",
          },
        },
      },
    ]);

    expect(
      getLiveAssetPriceSnapshot().get("eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"),
    ).toStrictEqual({ price: 1.01, pricePercentChange1d: 0.4 });
  });
});

describe("ingestMarketStatsPrices", () => {
  it("stores a direct market-stats tick for the subscribed currency", () => {
    const assetId = "eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
    ingestMarketStatsPrices(
      [
        {
          updates: [
            {
              assetId,
              currency: "usd",
              price: 1.5,
              pricePercentChange1d: 2,
            },
            {
              assetId: "eip155:1/slip44:60",
              currency: "eur",
              price: 9,
            },
          ],
        },
      ],
      "usd",
    );

    expect(getLiveAssetPriceSnapshot().get(assetId.toLowerCase())).toStrictEqual({
      price: 1.5,
      pricePercentChange1d: 2,
    });
    expect(getLiveAssetPriceSnapshot().get("eip155:1/slip44:60")).toBeUndefined();
  });
});

describe("subscribeLiveAssetPrices", () => {
  it("keeps delivering ticks after a subscribe, release, and subscribe", async () => {
    const callbacks: ((payload: unknown) => void)[] = [];
    const offs: jest.Mock[] = [];
    const resolvers: ((off: () => Promise<void>) => void)[] = [];

    subscribeToMessengerEventMock.mockImplementation((_event, callback) => {
      callbacks.push(callback as (payload: unknown) => void);
      return new Promise((resolve) => {
        const off = jest.fn().mockResolvedValue(undefined);
        offs.push(off);
        resolvers.push(resolve);
      });
    });

    const release = subscribeLiveAssetPrices(() => undefined);
    release();
    const releaseAgain = subscribeLiveAssetPrices(() => undefined);

    resolvers[0]?.(offs[0]);
    resolvers[1]?.(offs[1]);
    resolvers[2]?.(offs[2]);
    resolvers[3]?.(offs[3]);
    await Promise.resolve();

    callbacks[2]?.([
      {
        prices: {
          "eip155:1/slip44:60": { price: 10 },
        },
      },
    ]);

    expect(getLiveAssetPriceSnapshot().get("eip155:1/slip44:60")).toStrictEqual({ price: 10 });
    expect(offs[2]).not.toHaveBeenCalled();

    releaseAgain();
  });
});

describe("applyLiveTokenFiat", () => {
  it("replaces the fiat balance with balance times the streamed price", () => {
    const token = applyLiveTokenFiat(
      {
        balance: "2",
        tokenFiatAmount: 200,
        fiat: { balance: 200, conversionRate: 2400, currency: "usd" },
      },
      150,
    );

    expect(token.tokenFiatAmount).toBe(300);
    expect(token.fiat?.balance).toBe(300);
    expect(token.fiat?.conversionRate).toBe(2400);
  });

  it("leaves the row unchanged when there is no streamed price", () => {
    const token = {
      balance: "2",
      tokenFiatAmount: 200,
    };

    expect(applyLiveTokenFiat(token, undefined)).toBe(token);
  });
});

describe("liveFiatDelta", () => {
  it("sums the difference between streamed and polled fiat balances", () => {
    const delta = liveFiatDelta(
      [
        {
          balance: "2",
          fiat: { balance: 200 },
        },
      ],
      new Map([["eip155:1/slip44:60", { price: 150 }]]),
      () => "eip155:1/slip44:60",
    );

    expect(delta).toBe(100);
  });
});
