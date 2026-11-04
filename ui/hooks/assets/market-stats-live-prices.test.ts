import { subscribeToMessengerEvent } from "../../store/background-connection";
import {
  applyLiveTokenFiat,
  getLiveAssetPriceSnapshot,
  liveFiatDelta,
  liveGroupFiatAdjustments,
  subscribeLiveAssetPrices,
} from "./market-stats-live-prices";

jest.mock("../../store/background-connection", () => ({
  subscribeToMessengerEvent: jest.fn(),
  submitRequestToBackground: jest.fn(),
}));

const subscribeToMessengerEventMock = jest.mocked(subscribeToMessengerEvent);

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
    await Promise.resolve();

    callbacks[2]?.([
      {
        updates: [
          {
            assetId: "eip155:1/slip44:60",
            currency: "usd",
            price: 10,
          },
        ],
      },
    ]);

    expect(getLiveAssetPriceSnapshot().get("eip155:1/slip44:60")).toStrictEqual({ price: 10 });
    expect(offs[0]).toHaveBeenCalled();
    expect(offs[1]).toHaveBeenCalled();
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

describe("liveGroupFiatAdjustments", () => {
  const toAssetId = () => "eip155:1/slip44:60";

  it("moves each account total by the streamed price difference", () => {
    const adjustments = liveGroupFiatAdjustments(
      {
        "wallet/0": {
          "eip155:1": [{ balance: "1", fiat: { balance: 38.02 } }],
        },
        "wallet/1": {
          "eip155:1": [{ balance: "2", fiat: { balance: 10 } }],
        },
      },
      new Map([["eip155:1/slip44:60", { price: 38 }]]),
      toAssetId,
    );

    expect(adjustments.get("wallet/0")).toBeCloseTo(-0.02);
    expect(adjustments.get("wallet/1")).toBe(66);
  });

  it("returns an empty map when nothing is streaming", () => {
    const adjustments = liveGroupFiatAdjustments(
      {
        "wallet/0": {
          "eip155:1": [{ balance: "1", fiat: { balance: 1 } }],
        },
      },
      new Map(),
      toAssetId,
    );

    expect(adjustments.size).toBe(0);
  });
});
