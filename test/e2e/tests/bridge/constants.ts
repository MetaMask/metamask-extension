import type { FeatureFlagResponse } from '../../../../shared/types/bridge';

export const DEFAULT_FEATURE_FLAGS_RESPONSE: FeatureFlagResponse = {
  'extension-config': {
    refreshRate: 30000,
    maxRefreshCount: 5,
    support: false,
    chains: {
      '1': { isActiveSrc: true, isActiveDest: true },
      '42161': { isActiveSrc: true, isActiveDest: true },
      '59144': { isActiveSrc: true, isActiveDest: true },
    },
  },
};

export const LOCATOR = {
  MM_IMPORT_TOKENS_MODAL: (suffix: string) =>
    `[data-testid="import-tokens-modal-${suffix}"]`,
};

export const ETH_CONVERSION_RATE_USD = 3010;
export const MOCK_CURRENCY_RATES = {
  currencyRates: {
    ETH: {
      conversionDate: 1665507609.0,
      conversionRate: ETH_CONVERSION_RATE_USD,
      usdConversionRate: ETH_CONVERSION_RATE_USD,
    },
  },
};

export const MOCK_BRIDGE_ETH_TO_LINEA = [
  {
      "quote": {
          "requestId": "68d8e5f5-f0f8-4ee8-b24e-0a9d7faceed5",
          "srcChainId": 1,
          "srcTokenAmount": "991250000000000000",
          "srcAsset": {
              "address": "0x0000000000000000000000000000000000000000",
              "assetId": "eip155:1/slip44:60",
              "symbol": "ETH",
              "decimals": 18,
              "name": "Ethereum",
              "coingeckoId": "ethereum",
              "aggregators": [],
              "iconUrl": "https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/native/60.png",
              "metadata": {
                  "honeypotStatus": {},
                  "isContractVerified": false,
                  "erc20Permit": false,
                  "description": {
                      "en": "Ethereum is a global, open-source platform for decentralized applications. In other words, the vision is to create a world computer that anyone can build applications in a decentralized manner; while all states and data are distributed and publicly accessible. Ethereum supports smart contracts in which developers can write code in order to program digital value. Examples of decentralized apps (dapps) that are built on Ethereum includes tokens, non-fungible tokens, decentralized finance apps, lending protocol, decentralized exchanges, and much more.On Ethereum, all transactions and smart contract executions require a small fee to be paid. This fee is called Gas. In technical terms, Gas refers to the unit of measure on the amount of computational effort required to execute an operation or a smart contract. The more complex the execution operation is, the more gas is required to fulfill that operation. Gas fees are paid entirely in Ether (ETH), which is the native coin of the blockchain. The price of gas can fluctuate from time to time depending on the network demand.",
                      "ko": "이더리움(Ethereum/ETH)은 블록체인 기술에 기반한 클라우드 컴퓨팅 플랫폼 또는 프로그래밍 언어이다. 비탈릭 부테린이 개발하였다.비탈릭 부테린은 가상화폐인 비트코인에 사용된 핵심 기술인 블록체인(blockchain)에 화폐 거래 기록뿐 아니라 계약서 등의 추가 정보를 기록할 수 있다는 점에 착안하여, 전 세계 수많은 사용자들이 보유하고 있는 컴퓨팅 자원을 활용해 분산 네트워크를 구성하고, 이 플랫폼을 이용하여 SNS, 이메일, 전자투표 등 다양한 정보를 기록하는 시스템을 창안했다. 이더리움은 C++, 자바, 파이썬, GO 등 주요 프로그래밍 언어를 지원한다.이더리움을 사물 인터넷(IoT)에 적용하면 기계 간 금융 거래도 가능해진다. 예를 들어 고장난 청소로봇이 정비로봇에 돈을 내고 정비를 받고, 청소로봇은 돈을 벌기 위해 정비로봇의 집을 청소하는 것도 가능해진다.",
                      "zh": "Ethereum（以太坊）是一个平台和一种编程语言，使开发人员能够建立和发布下一代分布式应用。Ethereum 是使用甲醚作为燃料，以激励其网络的第一个图灵完备cryptocurrency。Ethereum（以太坊） 是由Vitalik Buterin的创建。该项目于2014年8月获得了美国1800万$比特币的价值及其crowdsale期间。在2016年，Ethereum（以太坊）的价格上涨超过50倍。",
                      "ja": "イーサリアム (Ethereum, ETH)・プロジェクトにより開発が進められている、分散型アプリケーション（DApps）やスマート・コントラクトを構築するためのプラットフォームの名称、及び関連するオープンソース・ソフトウェア・プロジェクトの総称である。イーサリアムでは、イーサリアム・ネットワークと呼ばれるP2Pのネットワーク上でスマート・コントラクトの履行履歴をブロックチェーンに記録していく。またイーサリアムは、スマート・コントラクトを記述するチューリング完全なプログラミング言語を持ち、ネットワーク参加者はこのネットワーク上のブロックチェーンに任意のDAppsやスマート・コントラクトを記述しそれを実行することが可能になる。ネットワーク参加者が「Ether」と呼ばれるイーサリアム内部通貨の報酬を目当てに、採掘と呼ばれるブロックチェーンへのスマート・コントラクトの履行結果の記録を行うことで、その正統性を保証していく。このような仕組みにより特定の中央管理組織に依拠せず、P2P全体を実行環境としてプログラムの実行とその結果を共有することが可能になった。"
                  },
                  "createdAt": "2023-10-31T22:41:58.553Z"
              },
              "chainId": 1,
              "price": "2064.02"
          },
          "destChainId": 59144,
          "destTokenAmount": "991248695868852800",
          "destAsset": {
              "address": "0x0000000000000000000000000000000000000000",
              "assetId": "eip155:59144/slip44:60",
              "symbol": "ETH",
              "decimals": 18,
              "name": "Ether",
              "coingeckoId": "ethereum",
              "aggregators": [],
              "iconUrl": "https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/59144/native/60.png",
              "metadata": {
                  "honeypotStatus": {},
                  "erc20Permit": false,
                  "description": {
                      "en": "Ethereum is a global, open-source platform for decentralized applications. In other words, the vision is to create a world computer that anyone can build applications in a decentralized manner; while all states and data are distributed and publicly accessible. Ethereum supports smart contracts in which developers can write code in order to program digital value. Examples of decentralized apps (dapps) that are built on Ethereum includes tokens, non-fungible tokens, decentralized finance apps, lending protocol, decentralized exchanges, and much more.On Ethereum, all transactions and smart contract executions require a small fee to be paid. This fee is called Gas. In technical terms, Gas refers to the unit of measure on the amount of computational effort required to execute an operation or a smart contract. The more complex the execution operation is, the more gas is required to fulfill that operation. Gas fees are paid entirely in Ether (ETH), which is the native coin of the blockchain. The price of gas can fluctuate from time to time depending on the network demand.",
                      "ko": "이더리움(Ethereum/ETH)은 블록체인 기술에 기반한 클라우드 컴퓨팅 플랫폼 또는 프로그래밍 언어이다. 비탈릭 부테린이 개발하였다.비탈릭 부테린은 가상화폐인 비트코인에 사용된 핵심 기술인 블록체인(blockchain)에 화폐 거래 기록뿐 아니라 계약서 등의 추가 정보를 기록할 수 있다는 점에 착안하여, 전 세계 수많은 사용자들이 보유하고 있는 컴퓨팅 자원을 활용해 분산 네트워크를 구성하고, 이 플랫폼을 이용하여 SNS, 이메일, 전자투표 등 다양한 정보를 기록하는 시스템을 창안했다. 이더리움은 C++, 자바, 파이썬, GO 등 주요 프로그래밍 언어를 지원한다.이더리움을 사물 인터넷(IoT)에 적용하면 기계 간 금융 거래도 가능해진다. 예를 들어 고장난 청소로봇이 정비로봇에 돈을 내고 정비를 받고, 청소로봇은 돈을 벌기 위해 정비로봇의 집을 청소하는 것도 가능해진다.",
                      "zh": "Ethereum（以太坊）是一个平台和一种编程语言，使开发人员能够建立和发布下一代分布式应用。Ethereum 是使用甲醚作为燃料，以激励其网络的第一个图灵完备cryptocurrency。Ethereum（以太坊） 是由Vitalik Buterin的创建。该项目于2014年8月获得了美国1800万$比特币的价值及其crowdsale期间。在2016年，Ethereum（以太坊）的价格上涨超过50倍。",
                      "ja": "イーサリアム (Ethereum, ETH)・プロジェクトにより開発が進められている、分散型アプリケーション（DApps）やスマート・コントラクトを構築するためのプラットフォームの名称、及び関連するオープンソース・ソフトウェア・プロジェクトの総称である。イーサリアムでは、イーサリアム・ネットワークと呼ばれるP2Pのネットワーク上でスマート・コントラクトの履行履歴をブロックチェーンに記録していく。またイーサリアムは、スマート・コントラクトを記述するチューリング完全なプログラミング言語を持ち、ネットワーク参加者はこのネットワーク上のブロックチェーンに任意のDAppsやスマート・コントラクトを記述しそれを実行することが可能になる。ネットワーク参加者が「Ether」と呼ばれるイーサリアム内部通貨の報酬を目当てに、採掘と呼ばれるブロックチェーンへのスマート・コントラクトの履行結果の記録を行うことで、その正統性を保証していく。このような仕組みにより特定の中央管理組織に依拠せず、P2P全体を実行環境としてプログラムの実行とその結果を共有することが可能になった。"
                  },
                  "createdAt": "2023-10-31T21:55:26.652Z"
              },
              "chainId": 59144,
              "price": "2067.38"
          },
          "feeData": {
              "metabridge": {
                  "amount": "8750000000000000",
                  "asset": {
                      "address": "0x0000000000000000000000000000000000000000",
                      "assetId": "eip155:1/slip44:60",
                      "symbol": "ETH",
                      "decimals": 18,
                      "name": "Ethereum",
                      "coingeckoId": "ethereum",
                      "aggregators": [],
                      "iconUrl": "https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/native/60.png",
                      "metadata": {
                          "honeypotStatus": {},
                          "isContractVerified": false,
                          "erc20Permit": false,
                          "description": {
                              "en": "Ethereum is a global, open-source platform for decentralized applications. In other words, the vision is to create a world computer that anyone can build applications in a decentralized manner; while all states and data are distributed and publicly accessible. Ethereum supports smart contracts in which developers can write code in order to program digital value. Examples of decentralized apps (dapps) that are built on Ethereum includes tokens, non-fungible tokens, decentralized finance apps, lending protocol, decentralized exchanges, and much more.On Ethereum, all transactions and smart contract executions require a small fee to be paid. This fee is called Gas. In technical terms, Gas refers to the unit of measure on the amount of computational effort required to execute an operation or a smart contract. The more complex the execution operation is, the more gas is required to fulfill that operation. Gas fees are paid entirely in Ether (ETH), which is the native coin of the blockchain. The price of gas can fluctuate from time to time depending on the network demand.",
                              "ko": "이더리움(Ethereum/ETH)은 블록체인 기술에 기반한 클라우드 컴퓨팅 플랫폼 또는 프로그래밍 언어이다. 비탈릭 부테린이 개발하였다.비탈릭 부테린은 가상화폐인 비트코인에 사용된 핵심 기술인 블록체인(blockchain)에 화폐 거래 기록뿐 아니라 계약서 등의 추가 정보를 기록할 수 있다는 점에 착안하여, 전 세계 수많은 사용자들이 보유하고 있는 컴퓨팅 자원을 활용해 분산 네트워크를 구성하고, 이 플랫폼을 이용하여 SNS, 이메일, 전자투표 등 다양한 정보를 기록하는 시스템을 창안했다. 이더리움은 C++, 자바, 파이썬, GO 등 주요 프로그래밍 언어를 지원한다.이더리움을 사물 인터넷(IoT)에 적용하면 기계 간 금융 거래도 가능해진다. 예를 들어 고장난 청소로봇이 정비로봇에 돈을 내고 정비를 받고, 청소로봇은 돈을 벌기 위해 정비로봇의 집을 청소하는 것도 가능해진다.",
                              "zh": "Ethereum（以太坊）是一个平台和一种编程语言，使开发人员能够建立和发布下一代分布式应用。Ethereum 是使用甲醚作为燃料，以激励其网络的第一个图灵完备cryptocurrency。Ethereum（以太坊） 是由Vitalik Buterin的创建。该项目于2014年8月获得了美国1800万$比特币的价值及其crowdsale期间。在2016年，Ethereum（以太坊）的价格上涨超过50倍。",
                              "ja": "イーサリアム (Ethereum, ETH)・プロジェクトにより開発が進められている、分散型アプリケーション（DApps）やスマート・コントラクトを構築するためのプラットフォームの名称、及び関連するオープンソース・ソフトウェア・プロジェクトの総称である。イーサリアムでは、イーサリアム・ネットワークと呼ばれるP2Pのネットワーク上でスマート・コントラクトの履行履歴をブロックチェーンに記録していく。またイーサリアムは、スマート・コントラクトを記述するチューリング完全なプログラミング言語を持ち、ネットワーク参加者はこのネットワーク上のブロックチェーンに任意のDAppsやスマート・コントラクトを記述しそれを実行することが可能になる。ネットワーク参加者が「Ether」と呼ばれるイーサリアム内部通貨の報酬を目当てに、採掘と呼ばれるブロックチェーンへのスマート・コントラクトの履行結果の記録を行うことで、その正統性を保証していく。このような仕組みにより特定の中央管理組織に依拠せず、P2P全体を実行環境としてプログラムの実行とその結果を共有することが可能になった。"
                          },
                          "createdAt": "2023-10-31T22:41:58.553Z"
                      },
                      "chainId": 1,
                      "price": "2064.02"
                  }
              }
          },
          "bridgeId": "lifi",
          "bridges": [
              "relay"
          ],
          "steps": [
              {
                  "action": "bridge",
                  "srcChainId": 1,
                  "destChainId": 59144,
                  "protocol": {
                      "name": "relay",
                      "displayName": "Relay",
                      "icon": "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/bridges/relay.svg"
                  },
                  "srcAsset": {
                      "address": "0x0000000000000000000000000000000000000000",
                      "assetId": "eip155:1/slip44:60",
                      "symbol": "ETH",
                      "decimals": 18,
                      "name": "Ethereum",
                      "coingeckoId": "ethereum",
                      "aggregators": [],
                      "iconUrl": "https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/native/60.png",
                      "metadata": {
                          "honeypotStatus": {},
                          "isContractVerified": false,
                          "erc20Permit": false,
                          "description": {
                              "en": "Ethereum is a global, open-source platform for decentralized applications. In other words, the vision is to create a world computer that anyone can build applications in a decentralized manner; while all states and data are distributed and publicly accessible. Ethereum supports smart contracts in which developers can write code in order to program digital value. Examples of decentralized apps (dapps) that are built on Ethereum includes tokens, non-fungible tokens, decentralized finance apps, lending protocol, decentralized exchanges, and much more.On Ethereum, all transactions and smart contract executions require a small fee to be paid. This fee is called Gas. In technical terms, Gas refers to the unit of measure on the amount of computational effort required to execute an operation or a smart contract. The more complex the execution operation is, the more gas is required to fulfill that operation. Gas fees are paid entirely in Ether (ETH), which is the native coin of the blockchain. The price of gas can fluctuate from time to time depending on the network demand.",
                              "ko": "이더리움(Ethereum/ETH)은 블록체인 기술에 기반한 클라우드 컴퓨팅 플랫폼 또는 프로그래밍 언어이다. 비탈릭 부테린이 개발하였다.비탈릭 부테린은 가상화폐인 비트코인에 사용된 핵심 기술인 블록체인(blockchain)에 화폐 거래 기록뿐 아니라 계약서 등의 추가 정보를 기록할 수 있다는 점에 착안하여, 전 세계 수많은 사용자들이 보유하고 있는 컴퓨팅 자원을 활용해 분산 네트워크를 구성하고, 이 플랫폼을 이용하여 SNS, 이메일, 전자투표 등 다양한 정보를 기록하는 시스템을 창안했다. 이더리움은 C++, 자바, 파이썬, GO 등 주요 프로그래밍 언어를 지원한다.이더리움을 사물 인터넷(IoT)에 적용하면 기계 간 금융 거래도 가능해진다. 예를 들어 고장난 청소로봇이 정비로봇에 돈을 내고 정비를 받고, 청소로봇은 돈을 벌기 위해 정비로봇의 집을 청소하는 것도 가능해진다.",
                              "zh": "Ethereum（以太坊）是一个平台和一种编程语言，使开发人员能够建立和发布下一代分布式应用。Ethereum 是使用甲醚作为燃料，以激励其网络的第一个图灵完备cryptocurrency。Ethereum（以太坊） 是由Vitalik Buterin的创建。该项目于2014年8月获得了美国1800万$比特币的价值及其crowdsale期间。在2016年，Ethereum（以太坊）的价格上涨超过50倍。",
                              "ja": "イーサリアム (Ethereum, ETH)・プロジェクトにより開発が進められている、分散型アプリケーション（DApps）やスマート・コントラクトを構築するためのプラットフォームの名称、及び関連するオープンソース・ソフトウェア・プロジェクトの総称である。イーサリアムでは、イーサリアム・ネットワークと呼ばれるP2Pのネットワーク上でスマート・コントラクトの履行履歴をブロックチェーンに記録していく。またイーサリアムは、スマート・コントラクトを記述するチューリング完全なプログラミング言語を持ち、ネットワーク参加者はこのネットワーク上のブロックチェーンに任意のDAppsやスマート・コントラクトを記述しそれを実行することが可能になる。ネットワーク参加者が「Ether」と呼ばれるイーサリアム内部通貨の報酬を目当てに、採掘と呼ばれるブロックチェーンへのスマート・コントラクトの履行結果の記録を行うことで、その正統性を保証していく。このような仕組みにより特定の中央管理組織に依拠せず、P2P全体を実行環境としてプログラムの実行とその結果を共有することが可能になった。"
                          },
                          "createdAt": "2023-10-31T22:41:58.553Z"
                      },
                      "chainId": 1
                  },
                  "destAsset": {
                      "address": "0x0000000000000000000000000000000000000000",
                      "assetId": "eip155:59144/slip44:60",
                      "symbol": "ETH",
                      "decimals": 18,
                      "name": "Ether",
                      "coingeckoId": "ethereum",
                      "aggregators": [],
                      "iconUrl": "https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/59144/native/60.png",
                      "metadata": {
                          "honeypotStatus": {},
                          "erc20Permit": false,
                          "description": {
                              "en": "Ethereum is a global, open-source platform for decentralized applications. In other words, the vision is to create a world computer that anyone can build applications in a decentralized manner; while all states and data are distributed and publicly accessible. Ethereum supports smart contracts in which developers can write code in order to program digital value. Examples of decentralized apps (dapps) that are built on Ethereum includes tokens, non-fungible tokens, decentralized finance apps, lending protocol, decentralized exchanges, and much more.On Ethereum, all transactions and smart contract executions require a small fee to be paid. This fee is called Gas. In technical terms, Gas refers to the unit of measure on the amount of computational effort required to execute an operation or a smart contract. The more complex the execution operation is, the more gas is required to fulfill that operation. Gas fees are paid entirely in Ether (ETH), which is the native coin of the blockchain. The price of gas can fluctuate from time to time depending on the network demand.",
                              "ko": "이더리움(Ethereum/ETH)은 블록체인 기술에 기반한 클라우드 컴퓨팅 플랫폼 또는 프로그래밍 언어이다. 비탈릭 부테린이 개발하였다.비탈릭 부테린은 가상화폐인 비트코인에 사용된 핵심 기술인 블록체인(blockchain)에 화폐 거래 기록뿐 아니라 계약서 등의 추가 정보를 기록할 수 있다는 점에 착안하여, 전 세계 수많은 사용자들이 보유하고 있는 컴퓨팅 자원을 활용해 분산 네트워크를 구성하고, 이 플랫폼을 이용하여 SNS, 이메일, 전자투표 등 다양한 정보를 기록하는 시스템을 창안했다. 이더리움은 C++, 자바, 파이썬, GO 등 주요 프로그래밍 언어를 지원한다.이더리움을 사물 인터넷(IoT)에 적용하면 기계 간 금융 거래도 가능해진다. 예를 들어 고장난 청소로봇이 정비로봇에 돈을 내고 정비를 받고, 청소로봇은 돈을 벌기 위해 정비로봇의 집을 청소하는 것도 가능해진다.",
                              "zh": "Ethereum（以太坊）是一个平台和一种编程语言，使开发人员能够建立和发布下一代分布式应用。Ethereum 是使用甲醚作为燃料，以激励其网络的第一个图灵完备cryptocurrency。Ethereum（以太坊） 是由Vitalik Buterin的创建。该项目于2014年8月获得了美国1800万$比特币的价值及其crowdsale期间。在2016年，Ethereum（以太坊）的价格上涨超过50倍。",
                              "ja": "イーサリアム (Ethereum, ETH)・プロジェクトにより開発が進められている、分散型アプリケーション（DApps）やスマート・コントラクトを構築するためのプラットフォームの名称、及び関連するオープンソース・ソフトウェア・プロジェクトの総称である。イーサリアムでは、イーサリアム・ネットワークと呼ばれるP2Pのネットワーク上でスマート・コントラクトの履行履歴をブロックチェーンに記録していく。またイーサリアムは、スマート・コントラクトを記述するチューリング完全なプログラミング言語を持ち、ネットワーク参加者はこのネットワーク上のブロックチェーンに任意のDAppsやスマート・コントラクトを記述しそれを実行することが可能になる。ネットワーク参加者が「Ether」と呼ばれるイーサリアム内部通貨の報酬を目当てに、採掘と呼ばれるブロックチェーンへのスマート・コントラクトの履行結果の記録を行うことで、その正統性を保証していく。このような仕組みにより特定の中央管理組織に依拠せず、P2P全体を実行環境としてプログラムの実行とその結果を共有することが可能になった。"
                          },
                          "createdAt": "2023-10-31T21:55:26.652Z"
                      },
                      "chainId": 59144
                  },
                  "srcAmount": "991250000000000000",
                  "destAmount": "991248695868852800"
              }
          ],
          "bridgePriceData": {
              "totalFromAmountUsd": "2045.9598",
              "totalToAmountUsd": "2049.2877",
              "priceImpact": "-0.0016265715484731285"
          }
      },
      "trade": {
          "chainId": 1,
          "to": "0x0439e60F02a8900a951603950d8D4527f400C3f1",
          "from": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
          "value": "0x0de0b6b3a7640000",
          "data": "0x3ce33bff000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000de0b6b3a764000000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000000d6c6966694164617074657256320000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004600000000000000000000000001231deb6f5749ef6ce6943a275a1d3e7486f4eae0000000000000000000000001231deb6f5749ef6ce6943a275a1d3e7486f4eae000000000000000000000000000000000000000000000000000000000000e708000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000dc1a09f859b20000000000000000000000000000000000000000000000000000000000000000140000000000000000000000000000000000000000000000000001f161421c8e000000000000000000000000000e6b738da243e8fa2a0ed5915645789add5de51520000000000000000000000000000000000000000000000000000000000000304ae328590000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000002007dfc3aae228737a24557fec5f2d1ea01afbdf68ef0efaf0ecb0737e569acce94000000000000000000000000000000000000000000000000000000000000014000000000000000000000000000000000000000000000000000000000000001800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c80000000000000000000000000000000000000000000000000dc1a09f859b2000000000000000000000000000000000000000000000000000000000000000e70800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000572656c6179000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000f6d6574616d61736b2d62726964676500000000000000000000000000000000003ce32391f71ab451a38a7fec44c59efd0c5b637f18654f468b45777a0bbdcd4000000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c80000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000415ab95998e4c0e19b18d028cfcf209c79c79a46f1de60fdbc540f6f2aabc4847e2656057e7b8647df4a06290dd1449a7c863ed104c43539d7bc8174c592e94c331c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045beca754d7d2ed755df236b7e0da2ae93333c0064264f8ee6f84c8d1c74b6da3fdb7c18e2967c38a28b89f6b3cff329696ea23df55607f4b181e15c63f4c1371b",
          "gasLimit": 209791
      },
      "estimatedProcessingTimeInSeconds": 24
  },
  {
      "quote": {
          "requestId": "2fdfe983-2c80-429f-8a00-01759b3fa030",
          "srcChainId": 1,
          "srcTokenAmount": "991250000000000000",
          "srcAsset": {
              "address": "0x0000000000000000000000000000000000000000",
              "assetId": "eip155:1/slip44:60",
              "symbol": "ETH",
              "decimals": 18,
              "name": "Ethereum",
              "coingeckoId": "ethereum",
              "aggregators": [],
              "iconUrl": "https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/native/60.png",
              "metadata": {
                  "honeypotStatus": {},
                  "isContractVerified": false,
                  "erc20Permit": false,
                  "description": {
                      "en": "Ethereum is a global, open-source platform for decentralized applications. In other words, the vision is to create a world computer that anyone can build applications in a decentralized manner; while all states and data are distributed and publicly accessible. Ethereum supports smart contracts in which developers can write code in order to program digital value. Examples of decentralized apps (dapps) that are built on Ethereum includes tokens, non-fungible tokens, decentralized finance apps, lending protocol, decentralized exchanges, and much more.On Ethereum, all transactions and smart contract executions require a small fee to be paid. This fee is called Gas. In technical terms, Gas refers to the unit of measure on the amount of computational effort required to execute an operation or a smart contract. The more complex the execution operation is, the more gas is required to fulfill that operation. Gas fees are paid entirely in Ether (ETH), which is the native coin of the blockchain. The price of gas can fluctuate from time to time depending on the network demand.",
                      "ko": "이더리움(Ethereum/ETH)은 블록체인 기술에 기반한 클라우드 컴퓨팅 플랫폼 또는 프로그래밍 언어이다. 비탈릭 부테린이 개발하였다.비탈릭 부테린은 가상화폐인 비트코인에 사용된 핵심 기술인 블록체인(blockchain)에 화폐 거래 기록뿐 아니라 계약서 등의 추가 정보를 기록할 수 있다는 점에 착안하여, 전 세계 수많은 사용자들이 보유하고 있는 컴퓨팅 자원을 활용해 분산 네트워크를 구성하고, 이 플랫폼을 이용하여 SNS, 이메일, 전자투표 등 다양한 정보를 기록하는 시스템을 창안했다. 이더리움은 C++, 자바, 파이썬, GO 등 주요 프로그래밍 언어를 지원한다.이더리움을 사물 인터넷(IoT)에 적용하면 기계 간 금융 거래도 가능해진다. 예를 들어 고장난 청소로봇이 정비로봇에 돈을 내고 정비를 받고, 청소로봇은 돈을 벌기 위해 정비로봇의 집을 청소하는 것도 가능해진다.",
                      "zh": "Ethereum（以太坊）是一个平台和一种编程语言，使开发人员能够建立和发布下一代分布式应用。Ethereum 是使用甲醚作为燃料，以激励其网络的第一个图灵完备cryptocurrency。Ethereum（以太坊） 是由Vitalik Buterin的创建。该项目于2014年8月获得了美国1800万$比特币的价值及其crowdsale期间。在2016年，Ethereum（以太坊）的价格上涨超过50倍。",
                      "ja": "イーサリアム (Ethereum, ETH)・プロジェクトにより開発が進められている、分散型アプリケーション（DApps）やスマート・コントラクトを構築するためのプラットフォームの名称、及び関連するオープンソース・ソフトウェア・プロジェクトの総称である。イーサリアムでは、イーサリアム・ネットワークと呼ばれるP2Pのネットワーク上でスマート・コントラクトの履行履歴をブロックチェーンに記録していく。またイーサリアムは、スマート・コントラクトを記述するチューリング完全なプログラミング言語を持ち、ネットワーク参加者はこのネットワーク上のブロックチェーンに任意のDAppsやスマート・コントラクトを記述しそれを実行することが可能になる。ネットワーク参加者が「Ether」と呼ばれるイーサリアム内部通貨の報酬を目当てに、採掘と呼ばれるブロックチェーンへのスマート・コントラクトの履行結果の記録を行うことで、その正統性を保証していく。このような仕組みにより特定の中央管理組織に依拠せず、P2P全体を実行環境としてプログラムの実行とその結果を共有することが可能になった。"
                  },
                  "createdAt": "2023-10-31T22:41:58.553Z"
              },
              "chainId": 1,
              "price": "2064.02"
          },
          "destChainId": 59144,
          "destTokenAmount": "991164561299030504",
          "destAsset": {
              "address": "0x0000000000000000000000000000000000000000",
              "assetId": "eip155:59144/slip44:60",
              "symbol": "ETH",
              "decimals": 18,
              "name": "Ether",
              "coingeckoId": "ethereum",
              "aggregators": [],
              "iconUrl": "https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/59144/native/60.png",
              "metadata": {
                  "honeypotStatus": {},
                  "erc20Permit": false,
                  "description": {
                      "en": "Ethereum is a global, open-source platform for decentralized applications. In other words, the vision is to create a world computer that anyone can build applications in a decentralized manner; while all states and data are distributed and publicly accessible. Ethereum supports smart contracts in which developers can write code in order to program digital value. Examples of decentralized apps (dapps) that are built on Ethereum includes tokens, non-fungible tokens, decentralized finance apps, lending protocol, decentralized exchanges, and much more.On Ethereum, all transactions and smart contract executions require a small fee to be paid. This fee is called Gas. In technical terms, Gas refers to the unit of measure on the amount of computational effort required to execute an operation or a smart contract. The more complex the execution operation is, the more gas is required to fulfill that operation. Gas fees are paid entirely in Ether (ETH), which is the native coin of the blockchain. The price of gas can fluctuate from time to time depending on the network demand.",
                      "ko": "이더리움(Ethereum/ETH)은 블록체인 기술에 기반한 클라우드 컴퓨팅 플랫폼 또는 프로그래밍 언어이다. 비탈릭 부테린이 개발하였다.비탈릭 부테린은 가상화폐인 비트코인에 사용된 핵심 기술인 블록체인(blockchain)에 화폐 거래 기록뿐 아니라 계약서 등의 추가 정보를 기록할 수 있다는 점에 착안하여, 전 세계 수많은 사용자들이 보유하고 있는 컴퓨팅 자원을 활용해 분산 네트워크를 구성하고, 이 플랫폼을 이용하여 SNS, 이메일, 전자투표 등 다양한 정보를 기록하는 시스템을 창안했다. 이더리움은 C++, 자바, 파이썬, GO 등 주요 프로그래밍 언어를 지원한다.이더리움을 사물 인터넷(IoT)에 적용하면 기계 간 금융 거래도 가능해진다. 예를 들어 고장난 청소로봇이 정비로봇에 돈을 내고 정비를 받고, 청소로봇은 돈을 벌기 위해 정비로봇의 집을 청소하는 것도 가능해진다.",
                      "zh": "Ethereum（以太坊）是一个平台和一种编程语言，使开发人员能够建立和发布下一代分布式应用。Ethereum 是使用甲醚作为燃料，以激励其网络的第一个图灵完备cryptocurrency。Ethereum（以太坊） 是由Vitalik Buterin的创建。该项目于2014年8月获得了美国1800万$比特币的价值及其crowdsale期间。在2016年，Ethereum（以太坊）的价格上涨超过50倍。",
                      "ja": "イーサリアム (Ethereum, ETH)・プロジェクトにより開発が進められている、分散型アプリケーション（DApps）やスマート・コントラクトを構築するためのプラットフォームの名称、及び関連するオープンソース・ソフトウェア・プロジェクトの総称である。イーサリアムでは、イーサリアム・ネットワークと呼ばれるP2Pのネットワーク上でスマート・コントラクトの履行履歴をブロックチェーンに記録していく。またイーサリアムは、スマート・コントラクトを記述するチューリング完全なプログラミング言語を持ち、ネットワーク参加者はこのネットワーク上のブロックチェーンに任意のDAppsやスマート・コントラクトを記述しそれを実行することが可能になる。ネットワーク参加者が「Ether」と呼ばれるイーサリアム内部通貨の報酬を目当てに、採掘と呼ばれるブロックチェーンへのスマート・コントラクトの履行結果の記録を行うことで、その正統性を保証していく。このような仕組みにより特定の中央管理組織に依拠せず、P2P全体を実行環境としてプログラムの実行とその結果を共有することが可能になった。"
                  },
                  "createdAt": "2023-10-31T21:55:26.652Z"
              },
              "chainId": 59144,
              "price": "2067.38"
          },
          "feeData": {
              "metabridge": {
                  "amount": "8750000000000000",
                  "asset": {
                      "address": "0x0000000000000000000000000000000000000000",
                      "assetId": "eip155:1/slip44:60",
                      "symbol": "ETH",
                      "decimals": 18,
                      "name": "Ethereum",
                      "coingeckoId": "ethereum",
                      "aggregators": [],
                      "iconUrl": "https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/native/60.png",
                      "metadata": {
                          "honeypotStatus": {},
                          "isContractVerified": false,
                          "erc20Permit": false,
                          "description": {
                              "en": "Ethereum is a global, open-source platform for decentralized applications. In other words, the vision is to create a world computer that anyone can build applications in a decentralized manner; while all states and data are distributed and publicly accessible. Ethereum supports smart contracts in which developers can write code in order to program digital value. Examples of decentralized apps (dapps) that are built on Ethereum includes tokens, non-fungible tokens, decentralized finance apps, lending protocol, decentralized exchanges, and much more.On Ethereum, all transactions and smart contract executions require a small fee to be paid. This fee is called Gas. In technical terms, Gas refers to the unit of measure on the amount of computational effort required to execute an operation or a smart contract. The more complex the execution operation is, the more gas is required to fulfill that operation. Gas fees are paid entirely in Ether (ETH), which is the native coin of the blockchain. The price of gas can fluctuate from time to time depending on the network demand.",
                              "ko": "이더리움(Ethereum/ETH)은 블록체인 기술에 기반한 클라우드 컴퓨팅 플랫폼 또는 프로그래밍 언어이다. 비탈릭 부테린이 개발하였다.비탈릭 부테린은 가상화폐인 비트코인에 사용된 핵심 기술인 블록체인(blockchain)에 화폐 거래 기록뿐 아니라 계약서 등의 추가 정보를 기록할 수 있다는 점에 착안하여, 전 세계 수많은 사용자들이 보유하고 있는 컴퓨팅 자원을 활용해 분산 네트워크를 구성하고, 이 플랫폼을 이용하여 SNS, 이메일, 전자투표 등 다양한 정보를 기록하는 시스템을 창안했다. 이더리움은 C++, 자바, 파이썬, GO 등 주요 프로그래밍 언어를 지원한다.이더리움을 사물 인터넷(IoT)에 적용하면 기계 간 금융 거래도 가능해진다. 예를 들어 고장난 청소로봇이 정비로봇에 돈을 내고 정비를 받고, 청소로봇은 돈을 벌기 위해 정비로봇의 집을 청소하는 것도 가능해진다.",
                              "zh": "Ethereum（以太坊）是一个平台和一种编程语言，使开发人员能够建立和发布下一代分布式应用。Ethereum 是使用甲醚作为燃料，以激励其网络的第一个图灵完备cryptocurrency。Ethereum（以太坊） 是由Vitalik Buterin的创建。该项目于2014年8月获得了美国1800万$比特币的价值及其crowdsale期间。在2016年，Ethereum（以太坊）的价格上涨超过50倍。",
                              "ja": "イーサリアム (Ethereum, ETH)・プロジェクトにより開発が進められている、分散型アプリケーション（DApps）やスマート・コントラクトを構築するためのプラットフォームの名称、及び関連するオープンソース・ソフトウェア・プロジェクトの総称である。イーサリアムでは、イーサリアム・ネットワークと呼ばれるP2Pのネットワーク上でスマート・コントラクトの履行履歴をブロックチェーンに記録していく。またイーサリアムは、スマート・コントラクトを記述するチューリング完全なプログラミング言語を持ち、ネットワーク参加者はこのネットワーク上のブロックチェーンに任意のDAppsやスマート・コントラクトを記述しそれを実行することが可能になる。ネットワーク参加者が「Ether」と呼ばれるイーサリアム内部通貨の報酬を目当てに、採掘と呼ばれるブロックチェーンへのスマート・コントラクトの履行結果の記録を行うことで、その正統性を保証していく。このような仕組みにより特定の中央管理組織に依拠せず、P2P全体を実行環境としてプログラムの実行とその結果を共有することが可能になった。"
                          },
                          "createdAt": "2023-10-31T22:41:58.553Z"
                      },
                      "chainId": 1,
                      "price": "2064.02"
                  }
              }
          },
          "bridgeId": "lifi",
          "bridges": [
              "across"
          ],
          "steps": [
              {
                  "action": "bridge",
                  "srcChainId": 1,
                  "destChainId": 59144,
                  "protocol": {
                      "name": "across",
                      "displayName": "AcrossV3",
                      "icon": "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/bridges/acrossv2.png"
                  },
                  "srcAsset": {
                      "address": "0x0000000000000000000000000000000000000000",
                      "assetId": "eip155:1/slip44:60",
                      "symbol": "ETH",
                      "decimals": 18,
                      "name": "Ethereum",
                      "coingeckoId": "ethereum",
                      "aggregators": [],
                      "iconUrl": "https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/native/60.png",
                      "metadata": {
                          "honeypotStatus": {},
                          "isContractVerified": false,
                          "erc20Permit": false,
                          "description": {
                              "en": "Ethereum is a global, open-source platform for decentralized applications. In other words, the vision is to create a world computer that anyone can build applications in a decentralized manner; while all states and data are distributed and publicly accessible. Ethereum supports smart contracts in which developers can write code in order to program digital value. Examples of decentralized apps (dapps) that are built on Ethereum includes tokens, non-fungible tokens, decentralized finance apps, lending protocol, decentralized exchanges, and much more.On Ethereum, all transactions and smart contract executions require a small fee to be paid. This fee is called Gas. In technical terms, Gas refers to the unit of measure on the amount of computational effort required to execute an operation or a smart contract. The more complex the execution operation is, the more gas is required to fulfill that operation. Gas fees are paid entirely in Ether (ETH), which is the native coin of the blockchain. The price of gas can fluctuate from time to time depending on the network demand.",
                              "ko": "이더리움(Ethereum/ETH)은 블록체인 기술에 기반한 클라우드 컴퓨팅 플랫폼 또는 프로그래밍 언어이다. 비탈릭 부테린이 개발하였다.비탈릭 부테린은 가상화폐인 비트코인에 사용된 핵심 기술인 블록체인(blockchain)에 화폐 거래 기록뿐 아니라 계약서 등의 추가 정보를 기록할 수 있다는 점에 착안하여, 전 세계 수많은 사용자들이 보유하고 있는 컴퓨팅 자원을 활용해 분산 네트워크를 구성하고, 이 플랫폼을 이용하여 SNS, 이메일, 전자투표 등 다양한 정보를 기록하는 시스템을 창안했다. 이더리움은 C++, 자바, 파이썬, GO 등 주요 프로그래밍 언어를 지원한다.이더리움을 사물 인터넷(IoT)에 적용하면 기계 간 금융 거래도 가능해진다. 예를 들어 고장난 청소로봇이 정비로봇에 돈을 내고 정비를 받고, 청소로봇은 돈을 벌기 위해 정비로봇의 집을 청소하는 것도 가능해진다.",
                              "zh": "Ethereum（以太坊）是一个平台和一种编程语言，使开发人员能够建立和发布下一代分布式应用。Ethereum 是使用甲醚作为燃料，以激励其网络的第一个图灵完备cryptocurrency。Ethereum（以太坊） 是由Vitalik Buterin的创建。该项目于2014年8月获得了美国1800万$比特币的价值及其crowdsale期间。在2016年，Ethereum（以太坊）的价格上涨超过50倍。",
                              "ja": "イーサリアム (Ethereum, ETH)・プロジェクトにより開発が進められている、分散型アプリケーション（DApps）やスマート・コントラクトを構築するためのプラットフォームの名称、及び関連するオープンソース・ソフトウェア・プロジェクトの総称である。イーサリアムでは、イーサリアム・ネットワークと呼ばれるP2Pのネットワーク上でスマート・コントラクトの履行履歴をブロックチェーンに記録していく。またイーサリアムは、スマート・コントラクトを記述するチューリング完全なプログラミング言語を持ち、ネットワーク参加者はこのネットワーク上のブロックチェーンに任意のDAppsやスマート・コントラクトを記述しそれを実行することが可能になる。ネットワーク参加者が「Ether」と呼ばれるイーサリアム内部通貨の報酬を目当てに、採掘と呼ばれるブロックチェーンへのスマート・コントラクトの履行結果の記録を行うことで、その正統性を保証していく。このような仕組みにより特定の中央管理組織に依拠せず、P2P全体を実行環境としてプログラムの実行とその結果を共有することが可能になった。"
                          },
                          "createdAt": "2023-10-31T22:41:58.553Z"
                      },
                      "chainId": 1
                  },
                  "destAsset": {
                      "address": "0x0000000000000000000000000000000000000000",
                      "assetId": "eip155:59144/slip44:60",
                      "symbol": "ETH",
                      "decimals": 18,
                      "name": "Ether",
                      "coingeckoId": "ethereum",
                      "aggregators": [],
                      "iconUrl": "https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/59144/native/60.png",
                      "metadata": {
                          "honeypotStatus": {},
                          "erc20Permit": false,
                          "description": {
                              "en": "Ethereum is a global, open-source platform for decentralized applications. In other words, the vision is to create a world computer that anyone can build applications in a decentralized manner; while all states and data are distributed and publicly accessible. Ethereum supports smart contracts in which developers can write code in order to program digital value. Examples of decentralized apps (dapps) that are built on Ethereum includes tokens, non-fungible tokens, decentralized finance apps, lending protocol, decentralized exchanges, and much more.On Ethereum, all transactions and smart contract executions require a small fee to be paid. This fee is called Gas. In technical terms, Gas refers to the unit of measure on the amount of computational effort required to execute an operation or a smart contract. The more complex the execution operation is, the more gas is required to fulfill that operation. Gas fees are paid entirely in Ether (ETH), which is the native coin of the blockchain. The price of gas can fluctuate from time to time depending on the network demand.",
                              "ko": "이더리움(Ethereum/ETH)은 블록체인 기술에 기반한 클라우드 컴퓨팅 플랫폼 또는 프로그래밍 언어이다. 비탈릭 부테린이 개발하였다.비탈릭 부테린은 가상화폐인 비트코인에 사용된 핵심 기술인 블록체인(blockchain)에 화폐 거래 기록뿐 아니라 계약서 등의 추가 정보를 기록할 수 있다는 점에 착안하여, 전 세계 수많은 사용자들이 보유하고 있는 컴퓨팅 자원을 활용해 분산 네트워크를 구성하고, 이 플랫폼을 이용하여 SNS, 이메일, 전자투표 등 다양한 정보를 기록하는 시스템을 창안했다. 이더리움은 C++, 자바, 파이썬, GO 등 주요 프로그래밍 언어를 지원한다.이더리움을 사물 인터넷(IoT)에 적용하면 기계 간 금융 거래도 가능해진다. 예를 들어 고장난 청소로봇이 정비로봇에 돈을 내고 정비를 받고, 청소로봇은 돈을 벌기 위해 정비로봇의 집을 청소하는 것도 가능해진다.",
                              "zh": "Ethereum（以太坊）是一个平台和一种编程语言，使开发人员能够建立和发布下一代分布式应用。Ethereum 是使用甲醚作为燃料，以激励其网络的第一个图灵完备cryptocurrency。Ethereum（以太坊） 是由Vitalik Buterin的创建。该项目于2014年8月获得了美国1800万$比特币的价值及其crowdsale期间。在2016年，Ethereum（以太坊）的价格上涨超过50倍。",
                              "ja": "イーサリアム (Ethereum, ETH)・プロジェクトにより開発が進められている、分散型アプリケーション（DApps）やスマート・コントラクトを構築するためのプラットフォームの名称、及び関連するオープンソース・ソフトウェア・プロジェクトの総称である。イーサリアムでは、イーサリアム・ネットワークと呼ばれるP2Pのネットワーク上でスマート・コントラクトの履行履歴をブロックチェーンに記録していく。またイーサリアムは、スマート・コントラクトを記述するチューリング完全なプログラミング言語を持ち、ネットワーク参加者はこのネットワーク上のブロックチェーンに任意のDAppsやスマート・コントラクトを記述しそれを実行することが可能になる。ネットワーク参加者が「Ether」と呼ばれるイーサリアム内部通貨の報酬を目当てに、採掘と呼ばれるブロックチェーンへのスマート・コントラクトの履行結果の記録を行うことで、その正統性を保証していく。このような仕組みにより特定の中央管理組織に依拠せず、P2P全体を実行環境としてプログラムの実行とその結果を共有することが可能になった。"
                          },
                          "createdAt": "2023-10-31T21:55:26.652Z"
                      },
                      "chainId": 59144
                  },
                  "srcAmount": "991250000000000000",
                  "destAmount": "991164561299030504"
              }
          ],
          "bridgePriceData": {
              "totalFromAmountUsd": "2045.9598",
              "totalToAmountUsd": "2049.1138",
              "priceImpact": "-0.0015415747660340131"
          }
      },
      "trade": {
          "chainId": 1,
          "to": "0x0439e60F02a8900a951603950d8D4527f400C3f1",
          "from": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
          "value": "0x0de0b6b3a7640000",
          "data": "0x3ce33bff000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000de0b6b3a764000000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000000d6c6966694164617074657256320000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000021a786957c69424a4353afe743242bd9db3cc07b00000000000000000000000021a786957c69424a4353afe743242bd9db3cc07b000000000000000000000000000000000000000000000000000000000000e708000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000dc1a09f859b20000000000000000000000000000000000000000000000000000000000000000140000000000000000000000000000000000000000000000000001f161421c8e000000000000000000000000000e6b738da243e8fa2a0ed5915645789add5de5152000000000000000000000000000000000000000000000000000000000000008cdf834e15a673803ab4827e3770997970c51812dc3a010c7d01b50e0d17dc79c870997970c51812dc3a010c7d01b50e0d17dc79c80000e708e5d7c2a44ffddf6b295a15c148167daaaf5cf34f0000000000000000000000000000000000000000000000000dc152eac62f41e8000000000000000000000000000000000000000067e2833767e2a6ef0000000000000000000000000000000000000000000000002ec8bdfaa0cb5b0455f27868c463cf9a5773438c76eeb9c7f307658cf657dda00e4b6a6f42198d08cb7661f6ad8b91ee836b793adf673c3f8d8a86cf08bf0a2e1b",
          "gasLimit": 159131
      },
      "estimatedProcessingTimeInSeconds": 20
  },
  {
      "quote": {
          "requestId": "60373257-b7e6-4462-acad-7dfbd8f57e73",
          "srcChainId": 1,
          "srcTokenAmount": "991250000000000000",
          "srcAsset": {
              "address": "0x0000000000000000000000000000000000000000",
              "assetId": "eip155:1/slip44:60",
              "symbol": "ETH",
              "decimals": 18,
              "name": "Ethereum",
              "coingeckoId": "ethereum",
              "aggregators": [],
              "iconUrl": "https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/native/60.png",
              "metadata": {
                  "honeypotStatus": {},
                  "isContractVerified": false,
                  "erc20Permit": false,
                  "description": {
                      "en": "Ethereum is a global, open-source platform for decentralized applications. In other words, the vision is to create a world computer that anyone can build applications in a decentralized manner; while all states and data are distributed and publicly accessible. Ethereum supports smart contracts in which developers can write code in order to program digital value. Examples of decentralized apps (dapps) that are built on Ethereum includes tokens, non-fungible tokens, decentralized finance apps, lending protocol, decentralized exchanges, and much more.On Ethereum, all transactions and smart contract executions require a small fee to be paid. This fee is called Gas. In technical terms, Gas refers to the unit of measure on the amount of computational effort required to execute an operation or a smart contract. The more complex the execution operation is, the more gas is required to fulfill that operation. Gas fees are paid entirely in Ether (ETH), which is the native coin of the blockchain. The price of gas can fluctuate from time to time depending on the network demand.",
                      "ko": "이더리움(Ethereum/ETH)은 블록체인 기술에 기반한 클라우드 컴퓨팅 플랫폼 또는 프로그래밍 언어이다. 비탈릭 부테린이 개발하였다.비탈릭 부테린은 가상화폐인 비트코인에 사용된 핵심 기술인 블록체인(blockchain)에 화폐 거래 기록뿐 아니라 계약서 등의 추가 정보를 기록할 수 있다는 점에 착안하여, 전 세계 수많은 사용자들이 보유하고 있는 컴퓨팅 자원을 활용해 분산 네트워크를 구성하고, 이 플랫폼을 이용하여 SNS, 이메일, 전자투표 등 다양한 정보를 기록하는 시스템을 창안했다. 이더리움은 C++, 자바, 파이썬, GO 등 주요 프로그래밍 언어를 지원한다.이더리움을 사물 인터넷(IoT)에 적용하면 기계 간 금융 거래도 가능해진다. 예를 들어 고장난 청소로봇이 정비로봇에 돈을 내고 정비를 받고, 청소로봇은 돈을 벌기 위해 정비로봇의 집을 청소하는 것도 가능해진다.",
                      "zh": "Ethereum（以太坊）是一个平台和一种编程语言，使开发人员能够建立和发布下一代分布式应用。Ethereum 是使用甲醚作为燃料，以激励其网络的第一个图灵完备cryptocurrency。Ethereum（以太坊） 是由Vitalik Buterin的创建。该项目于2014年8月获得了美国1800万$比特币的价值及其crowdsale期间。在2016年，Ethereum（以太坊）的价格上涨超过50倍。",
                      "ja": "イーサリアム (Ethereum, ETH)・プロジェクトにより開発が進められている、分散型アプリケーション（DApps）やスマート・コントラクトを構築するためのプラットフォームの名称、及び関連するオープンソース・ソフトウェア・プロジェクトの総称である。イーサリアムでは、イーサリアム・ネットワークと呼ばれるP2Pのネットワーク上でスマート・コントラクトの履行履歴をブロックチェーンに記録していく。またイーサリアムは、スマート・コントラクトを記述するチューリング完全なプログラミング言語を持ち、ネットワーク参加者はこのネットワーク上のブロックチェーンに任意のDAppsやスマート・コントラクトを記述しそれを実行することが可能になる。ネットワーク参加者が「Ether」と呼ばれるイーサリアム内部通貨の報酬を目当てに、採掘と呼ばれるブロックチェーンへのスマート・コントラクトの履行結果の記録を行うことで、その正統性を保証していく。このような仕組みにより特定の中央管理組織に依拠せず、P2P全体を実行環境としてプログラムの実行とその結果を共有することが可能になった。"
                  },
                  "createdAt": "2023-10-31T22:41:58.553Z"
              },
              "chainId": 1,
              "price": "2064.02"
          },
          "destChainId": 59144,
          "destTokenAmount": "991092818451820548",
          "destAsset": {
              "address": "0x0000000000000000000000000000000000000000",
              "assetId": "eip155:59144/slip44:60",
              "symbol": "ETH",
              "decimals": 18,
              "name": "Ether",
              "coingeckoId": "ethereum",
              "aggregators": [],
              "iconUrl": "https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/59144/native/60.png",
              "metadata": {
                  "honeypotStatus": {},
                  "erc20Permit": false,
                  "description": {
                      "en": "Ethereum is a global, open-source platform for decentralized applications. In other words, the vision is to create a world computer that anyone can build applications in a decentralized manner; while all states and data are distributed and publicly accessible. Ethereum supports smart contracts in which developers can write code in order to program digital value. Examples of decentralized apps (dapps) that are built on Ethereum includes tokens, non-fungible tokens, decentralized finance apps, lending protocol, decentralized exchanges, and much more.On Ethereum, all transactions and smart contract executions require a small fee to be paid. This fee is called Gas. In technical terms, Gas refers to the unit of measure on the amount of computational effort required to execute an operation or a smart contract. The more complex the execution operation is, the more gas is required to fulfill that operation. Gas fees are paid entirely in Ether (ETH), which is the native coin of the blockchain. The price of gas can fluctuate from time to time depending on the network demand.",
                      "ko": "이더리움(Ethereum/ETH)은 블록체인 기술에 기반한 클라우드 컴퓨팅 플랫폼 또는 프로그래밍 언어이다. 비탈릭 부테린이 개발하였다.비탈릭 부테린은 가상화폐인 비트코인에 사용된 핵심 기술인 블록체인(blockchain)에 화폐 거래 기록뿐 아니라 계약서 등의 추가 정보를 기록할 수 있다는 점에 착안하여, 전 세계 수많은 사용자들이 보유하고 있는 컴퓨팅 자원을 활용해 분산 네트워크를 구성하고, 이 플랫폼을 이용하여 SNS, 이메일, 전자투표 등 다양한 정보를 기록하는 시스템을 창안했다. 이더리움은 C++, 자바, 파이썬, GO 등 주요 프로그래밍 언어를 지원한다.이더리움을 사물 인터넷(IoT)에 적용하면 기계 간 금융 거래도 가능해진다. 예를 들어 고장난 청소로봇이 정비로봇에 돈을 내고 정비를 받고, 청소로봇은 돈을 벌기 위해 정비로봇의 집을 청소하는 것도 가능해진다.",
                      "zh": "Ethereum（以太坊）是一个平台和一种编程语言，使开发人员能够建立和发布下一代分布式应用。Ethereum 是使用甲醚作为燃料，以激励其网络的第一个图灵完备cryptocurrency。Ethereum（以太坊） 是由Vitalik Buterin的创建。该项目于2014年8月获得了美国1800万$比特币的价值及其crowdsale期间。在2016年，Ethereum（以太坊）的价格上涨超过50倍。",
                      "ja": "イーサリアム (Ethereum, ETH)・プロジェクトにより開発が進められている、分散型アプリケーション（DApps）やスマート・コントラクトを構築するためのプラットフォームの名称、及び関連するオープンソース・ソフトウェア・プロジェクトの総称である。イーサリアムでは、イーサリアム・ネットワークと呼ばれるP2Pのネットワーク上でスマート・コントラクトの履行履歴をブロックチェーンに記録していく。またイーサリアムは、スマート・コントラクトを記述するチューリング完全なプログラミング言語を持ち、ネットワーク参加者はこのネットワーク上のブロックチェーンに任意のDAppsやスマート・コントラクトを記述しそれを実行することが可能になる。ネットワーク参加者が「Ether」と呼ばれるイーサリアム内部通貨の報酬を目当てに、採掘と呼ばれるブロックチェーンへのスマート・コントラクトの履行結果の記録を行うことで、その正統性を保証していく。このような仕組みにより特定の中央管理組織に依拠せず、P2P全体を実行環境としてプログラムの実行とその結果を共有することが可能になった。"
                  },
                  "createdAt": "2023-10-31T21:55:26.652Z"
              },
              "chainId": 59144,
              "price": "2067.38"
          },
          "feeData": {
              "metabridge": {
                  "amount": "8750000000000000",
                  "asset": {
                      "address": "0x0000000000000000000000000000000000000000",
                      "assetId": "eip155:1/slip44:60",
                      "symbol": "ETH",
                      "decimals": 18,
                      "name": "Ethereum",
                      "coingeckoId": "ethereum",
                      "aggregators": [],
                      "iconUrl": "https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/native/60.png",
                      "metadata": {
                          "honeypotStatus": {},
                          "isContractVerified": false,
                          "erc20Permit": false,
                          "description": {
                              "en": "Ethereum is a global, open-source platform for decentralized applications. In other words, the vision is to create a world computer that anyone can build applications in a decentralized manner; while all states and data are distributed and publicly accessible. Ethereum supports smart contracts in which developers can write code in order to program digital value. Examples of decentralized apps (dapps) that are built on Ethereum includes tokens, non-fungible tokens, decentralized finance apps, lending protocol, decentralized exchanges, and much more.On Ethereum, all transactions and smart contract executions require a small fee to be paid. This fee is called Gas. In technical terms, Gas refers to the unit of measure on the amount of computational effort required to execute an operation or a smart contract. The more complex the execution operation is, the more gas is required to fulfill that operation. Gas fees are paid entirely in Ether (ETH), which is the native coin of the blockchain. The price of gas can fluctuate from time to time depending on the network demand.",
                              "ko": "이더리움(Ethereum/ETH)은 블록체인 기술에 기반한 클라우드 컴퓨팅 플랫폼 또는 프로그래밍 언어이다. 비탈릭 부테린이 개발하였다.비탈릭 부테린은 가상화폐인 비트코인에 사용된 핵심 기술인 블록체인(blockchain)에 화폐 거래 기록뿐 아니라 계약서 등의 추가 정보를 기록할 수 있다는 점에 착안하여, 전 세계 수많은 사용자들이 보유하고 있는 컴퓨팅 자원을 활용해 분산 네트워크를 구성하고, 이 플랫폼을 이용하여 SNS, 이메일, 전자투표 등 다양한 정보를 기록하는 시스템을 창안했다. 이더리움은 C++, 자바, 파이썬, GO 등 주요 프로그래밍 언어를 지원한다.이더리움을 사물 인터넷(IoT)에 적용하면 기계 간 금융 거래도 가능해진다. 예를 들어 고장난 청소로봇이 정비로봇에 돈을 내고 정비를 받고, 청소로봇은 돈을 벌기 위해 정비로봇의 집을 청소하는 것도 가능해진다.",
                              "zh": "Ethereum（以太坊）是一个平台和一种编程语言，使开发人员能够建立和发布下一代分布式应用。Ethereum 是使用甲醚作为燃料，以激励其网络的第一个图灵完备cryptocurrency。Ethereum（以太坊） 是由Vitalik Buterin的创建。该项目于2014年8月获得了美国1800万$比特币的价值及其crowdsale期间。在2016年，Ethereum（以太坊）的价格上涨超过50倍。",
                              "ja": "イーサリアム (Ethereum, ETH)・プロジェクトにより開発が進められている、分散型アプリケーション（DApps）やスマート・コントラクトを構築するためのプラットフォームの名称、及び関連するオープンソース・ソフトウェア・プロジェクトの総称である。イーサリアムでは、イーサリアム・ネットワークと呼ばれるP2Pのネットワーク上でスマート・コントラクトの履行履歴をブロックチェーンに記録していく。またイーサリアムは、スマート・コントラクトを記述するチューリング完全なプログラミング言語を持ち、ネットワーク参加者はこのネットワーク上のブロックチェーンに任意のDAppsやスマート・コントラクトを記述しそれを実行することが可能になる。ネットワーク参加者が「Ether」と呼ばれるイーサリアム内部通貨の報酬を目当てに、採掘と呼ばれるブロックチェーンへのスマート・コントラクトの履行結果の記録を行うことで、その正統性を保証していく。このような仕組みにより特定の中央管理組織に依拠せず、P2P全体を実行環境としてプログラムの実行とその結果を共有することが可能になった。"
                          },
                          "createdAt": "2023-10-31T22:41:58.553Z"
                      },
                      "chainId": 1,
                      "price": "2064.02"
                  }
              }
          },
          "bridgeId": "lifi",
          "bridges": [
              "celer"
          ],
          "steps": [
              {
                  "action": "bridge",
                  "srcChainId": 1,
                  "destChainId": 59144,
                  "protocol": {
                      "name": "celer",
                      "displayName": "Celer cBridge",
                      "icon": "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/bridges/cbridge.svg"
                  },
                  "srcAsset": {
                      "address": "0x0000000000000000000000000000000000000000",
                      "assetId": "eip155:1/slip44:60",
                      "symbol": "ETH",
                      "decimals": 18,
                      "name": "Ethereum",
                      "coingeckoId": "ethereum",
                      "aggregators": [],
                      "iconUrl": "https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/native/60.png",
                      "metadata": {
                          "honeypotStatus": {},
                          "isContractVerified": false,
                          "erc20Permit": false,
                          "description": {
                              "en": "Ethereum is a global, open-source platform for decentralized applications. In other words, the vision is to create a world computer that anyone can build applications in a decentralized manner; while all states and data are distributed and publicly accessible. Ethereum supports smart contracts in which developers can write code in order to program digital value. Examples of decentralized apps (dapps) that are built on Ethereum includes tokens, non-fungible tokens, decentralized finance apps, lending protocol, decentralized exchanges, and much more.On Ethereum, all transactions and smart contract executions require a small fee to be paid. This fee is called Gas. In technical terms, Gas refers to the unit of measure on the amount of computational effort required to execute an operation or a smart contract. The more complex the execution operation is, the more gas is required to fulfill that operation. Gas fees are paid entirely in Ether (ETH), which is the native coin of the blockchain. The price of gas can fluctuate from time to time depending on the network demand.",
                              "ko": "이더리움(Ethereum/ETH)은 블록체인 기술에 기반한 클라우드 컴퓨팅 플랫폼 또는 프로그래밍 언어이다. 비탈릭 부테린이 개발하였다.비탈릭 부테린은 가상화폐인 비트코인에 사용된 핵심 기술인 블록체인(blockchain)에 화폐 거래 기록뿐 아니라 계약서 등의 추가 정보를 기록할 수 있다는 점에 착안하여, 전 세계 수많은 사용자들이 보유하고 있는 컴퓨팅 자원을 활용해 분산 네트워크를 구성하고, 이 플랫폼을 이용하여 SNS, 이메일, 전자투표 등 다양한 정보를 기록하는 시스템을 창안했다. 이더리움은 C++, 자바, 파이썬, GO 등 주요 프로그래밍 언어를 지원한다.이더리움을 사물 인터넷(IoT)에 적용하면 기계 간 금융 거래도 가능해진다. 예를 들어 고장난 청소로봇이 정비로봇에 돈을 내고 정비를 받고, 청소로봇은 돈을 벌기 위해 정비로봇의 집을 청소하는 것도 가능해진다.",
                              "zh": "Ethereum（以太坊）是一个平台和一种编程语言，使开发人员能够建立和发布下一代分布式应用。Ethereum 是使用甲醚作为燃料，以激励其网络的第一个图灵完备cryptocurrency。Ethereum（以太坊） 是由Vitalik Buterin的创建。该项目于2014年8月获得了美国1800万$比特币的价值及其crowdsale期间。在2016年，Ethereum（以太坊）的价格上涨超过50倍。",
                              "ja": "イーサリアム (Ethereum, ETH)・プロジェクトにより開発が進められている、分散型アプリケーション（DApps）やスマート・コントラクトを構築するためのプラットフォームの名称、及び関連するオープンソース・ソフトウェア・プロジェクトの総称である。イーサリアムでは、イーサリアム・ネットワークと呼ばれるP2Pのネットワーク上でスマート・コントラクトの履行履歴をブロックチェーンに記録していく。またイーサリアムは、スマート・コントラクトを記述するチューリング完全なプログラミング言語を持ち、ネットワーク参加者はこのネットワーク上のブロックチェーンに任意のDAppsやスマート・コントラクトを記述しそれを実行することが可能になる。ネットワーク参加者が「Ether」と呼ばれるイーサリアム内部通貨の報酬を目当てに、採掘と呼ばれるブロックチェーンへのスマート・コントラクトの履行結果の記録を行うことで、その正統性を保証していく。このような仕組みにより特定の中央管理組織に依拠せず、P2P全体を実行環境としてプログラムの実行とその結果を共有することが可能になった。"
                          },
                          "createdAt": "2023-10-31T22:41:58.553Z"
                      },
                      "chainId": 1
                  },
                  "destAsset": {
                      "address": "0x0000000000000000000000000000000000000000",
                      "assetId": "eip155:59144/slip44:60",
                      "symbol": "ETH",
                      "decimals": 18,
                      "name": "Ether",
                      "coingeckoId": "ethereum",
                      "aggregators": [],
                      "iconUrl": "https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/59144/native/60.png",
                      "metadata": {
                          "honeypotStatus": {},
                          "erc20Permit": false,
                          "description": {
                              "en": "Ethereum is a global, open-source platform for decentralized applications. In other words, the vision is to create a world computer that anyone can build applications in a decentralized manner; while all states and data are distributed and publicly accessible. Ethereum supports smart contracts in which developers can write code in order to program digital value. Examples of decentralized apps (dapps) that are built on Ethereum includes tokens, non-fungible tokens, decentralized finance apps, lending protocol, decentralized exchanges, and much more.On Ethereum, all transactions and smart contract executions require a small fee to be paid. This fee is called Gas. In technical terms, Gas refers to the unit of measure on the amount of computational effort required to execute an operation or a smart contract. The more complex the execution operation is, the more gas is required to fulfill that operation. Gas fees are paid entirely in Ether (ETH), which is the native coin of the blockchain. The price of gas can fluctuate from time to time depending on the network demand.",
                              "ko": "이더리움(Ethereum/ETH)은 블록체인 기술에 기반한 클라우드 컴퓨팅 플랫폼 또는 프로그래밍 언어이다. 비탈릭 부테린이 개발하였다.비탈릭 부테린은 가상화폐인 비트코인에 사용된 핵심 기술인 블록체인(blockchain)에 화폐 거래 기록뿐 아니라 계약서 등의 추가 정보를 기록할 수 있다는 점에 착안하여, 전 세계 수많은 사용자들이 보유하고 있는 컴퓨팅 자원을 활용해 분산 네트워크를 구성하고, 이 플랫폼을 이용하여 SNS, 이메일, 전자투표 등 다양한 정보를 기록하는 시스템을 창안했다. 이더리움은 C++, 자바, 파이썬, GO 등 주요 프로그래밍 언어를 지원한다.이더리움을 사물 인터넷(IoT)에 적용하면 기계 간 금융 거래도 가능해진다. 예를 들어 고장난 청소로봇이 정비로봇에 돈을 내고 정비를 받고, 청소로봇은 돈을 벌기 위해 정비로봇의 집을 청소하는 것도 가능해진다.",
                              "zh": "Ethereum（以太坊）是一个平台和一种编程语言，使开发人员能够建立和发布下一代分布式应用。Ethereum 是使用甲醚作为燃料，以激励其网络的第一个图灵完备cryptocurrency。Ethereum（以太坊） 是由Vitalik Buterin的创建。该项目于2014年8月获得了美国1800万$比特币的价值及其crowdsale期间。在2016年，Ethereum（以太坊）的价格上涨超过50倍。",
                              "ja": "イーサリアム (Ethereum, ETH)・プロジェクトにより開発が進められている、分散型アプリケーション（DApps）やスマート・コントラクトを構築するためのプラットフォームの名称、及び関連するオープンソース・ソフトウェア・プロジェクトの総称である。イーサリアムでは、イーサリアム・ネットワークと呼ばれるP2Pのネットワーク上でスマート・コントラクトの履行履歴をブロックチェーンに記録していく。またイーサリアムは、スマート・コントラクトを記述するチューリング完全なプログラミング言語を持ち、ネットワーク参加者はこのネットワーク上のブロックチェーンに任意のDAppsやスマート・コントラクトを記述しそれを実行することが可能になる。ネットワーク参加者が「Ether」と呼ばれるイーサリアム内部通貨の報酬を目当てに、採掘と呼ばれるブロックチェーンへのスマート・コントラクトの履行結果の記録を行うことで、その正統性を保証していく。このような仕組みにより特定の中央管理組織に依拠せず、P2P全体を実行環境としてプログラムの実行とその結果を共有することが可能になった。"
                          },
                          "createdAt": "2023-10-31T21:55:26.652Z"
                      },
                      "chainId": 59144
                  },
                  "srcAmount": "991250000000000000",
                  "destAmount": "991092818451820548"
              }
          ],
          "bridgePriceData": {
              "totalFromAmountUsd": "2045.9598",
              "totalToAmountUsd": "2048.9655",
              "priceImpact": "-0.001469090448404561"
          }
      },
      "trade": {
          "chainId": 1,
          "to": "0x0439e60F02a8900a951603950d8D4527f400C3f1",
          "from": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
          "value": "0x0de0b6b3a7640000",
          "data": "0x3ce33bff000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000de0b6b3a764000000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000000d6c696669416461707465725632000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000180000000000000000000000000e7bf43c55551b1036e796e7fd3b125d1f9903e2e000000000000000000000000e7bf43c55551b1036e796e7fd3b125d1f9903e2e000000000000000000000000000000000000000000000000000000000000e708000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000dc1a09f859b20000000000000000000000000000000000000000000000000000000000000000140000000000000000000000000000000000000000000000000001f161421c8e000000000000000000000000000e6b738da243e8fa2a0ed5915645789add5de5152000000000000000000000000000000000000000000000000000000000000002c0078afb6c47aaa442686c67d70997970c51812dc3a010c7d01b50e0d17dc79c80000e708ccd2d126000027ae0000000000000000000000000000000000000000b24278831b18fa079cad20823e0d405972b894cde5977afea359cab021742b393645d55cb2cdcc252b207ee5385a45ca6f0694934fd047eb163728ddda41a1741c",
          "gasLimit": 174543
      },
      "estimatedProcessingTimeInSeconds": 113
  },
  {
      "quote": {
          "requestId": "48108d6a-5b27-4096-a37b-c1c57f6293ee",
          "srcChainId": 1,
          "srcTokenAmount": "991250000000000000",
          "srcAsset": {
              "address": "0x0000000000000000000000000000000000000000",
              "assetId": "eip155:1/slip44:60",
              "symbol": "ETH",
              "decimals": 18,
              "name": "Ethereum",
              "coingeckoId": "ethereum",
              "aggregators": [],
              "iconUrl": "https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/native/60.png",
              "metadata": {
                  "honeypotStatus": {},
                  "isContractVerified": false,
                  "erc20Permit": false,
                  "description": {
                      "en": "Ethereum is a global, open-source platform for decentralized applications. In other words, the vision is to create a world computer that anyone can build applications in a decentralized manner; while all states and data are distributed and publicly accessible. Ethereum supports smart contracts in which developers can write code in order to program digital value. Examples of decentralized apps (dapps) that are built on Ethereum includes tokens, non-fungible tokens, decentralized finance apps, lending protocol, decentralized exchanges, and much more.On Ethereum, all transactions and smart contract executions require a small fee to be paid. This fee is called Gas. In technical terms, Gas refers to the unit of measure on the amount of computational effort required to execute an operation or a smart contract. The more complex the execution operation is, the more gas is required to fulfill that operation. Gas fees are paid entirely in Ether (ETH), which is the native coin of the blockchain. The price of gas can fluctuate from time to time depending on the network demand.",
                      "ko": "이더리움(Ethereum/ETH)은 블록체인 기술에 기반한 클라우드 컴퓨팅 플랫폼 또는 프로그래밍 언어이다. 비탈릭 부테린이 개발하였다.비탈릭 부테린은 가상화폐인 비트코인에 사용된 핵심 기술인 블록체인(blockchain)에 화폐 거래 기록뿐 아니라 계약서 등의 추가 정보를 기록할 수 있다는 점에 착안하여, 전 세계 수많은 사용자들이 보유하고 있는 컴퓨팅 자원을 활용해 분산 네트워크를 구성하고, 이 플랫폼을 이용하여 SNS, 이메일, 전자투표 등 다양한 정보를 기록하는 시스템을 창안했다. 이더리움은 C++, 자바, 파이썬, GO 등 주요 프로그래밍 언어를 지원한다.이더리움을 사물 인터넷(IoT)에 적용하면 기계 간 금융 거래도 가능해진다. 예를 들어 고장난 청소로봇이 정비로봇에 돈을 내고 정비를 받고, 청소로봇은 돈을 벌기 위해 정비로봇의 집을 청소하는 것도 가능해진다.",
                      "zh": "Ethereum（以太坊）是一个平台和一种编程语言，使开发人员能够建立和发布下一代分布式应用。Ethereum 是使用甲醚作为燃料，以激励其网络的第一个图灵完备cryptocurrency。Ethereum（以太坊） 是由Vitalik Buterin的创建。该项目于2014年8月获得了美国1800万$比特币的价值及其crowdsale期间。在2016年，Ethereum（以太坊）的价格上涨超过50倍。",
                      "ja": "イーサリアム (Ethereum, ETH)・プロジェクトにより開発が進められている、分散型アプリケーション（DApps）やスマート・コントラクトを構築するためのプラットフォームの名称、及び関連するオープンソース・ソフトウェア・プロジェクトの総称である。イーサリアムでは、イーサリアム・ネットワークと呼ばれるP2Pのネットワーク上でスマート・コントラクトの履行履歴をブロックチェーンに記録していく。またイーサリアムは、スマート・コントラクトを記述するチューリング完全なプログラミング言語を持ち、ネットワーク参加者はこのネットワーク上のブロックチェーンに任意のDAppsやスマート・コントラクトを記述しそれを実行することが可能になる。ネットワーク参加者が「Ether」と呼ばれるイーサリアム内部通貨の報酬を目当てに、採掘と呼ばれるブロックチェーンへのスマート・コントラクトの履行結果の記録を行うことで、その正統性を保証していく。このような仕組みにより特定の中央管理組織に依拠せず、P2P全体を実行環境としてプログラムの実行とその結果を共有することが可能になった。"
                  },
                  "createdAt": "2023-10-31T22:41:58.553Z"
              },
              "chainId": 1,
              "price": "2064.02"
          },
          "destChainId": 59144,
          "destTokenAmount": "991150000000000000",
          "destAsset": {
              "address": "0x0000000000000000000000000000000000000000",
              "assetId": "eip155:59144/slip44:60",
              "symbol": "ETH",
              "decimals": 18,
              "name": "Ether",
              "coingeckoId": "ethereum",
              "aggregators": [],
              "iconUrl": "https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/59144/native/60.png",
              "metadata": {
                  "honeypotStatus": {},
                  "erc20Permit": false,
                  "description": {
                      "en": "Ethereum is a global, open-source platform for decentralized applications. In other words, the vision is to create a world computer that anyone can build applications in a decentralized manner; while all states and data are distributed and publicly accessible. Ethereum supports smart contracts in which developers can write code in order to program digital value. Examples of decentralized apps (dapps) that are built on Ethereum includes tokens, non-fungible tokens, decentralized finance apps, lending protocol, decentralized exchanges, and much more.On Ethereum, all transactions and smart contract executions require a small fee to be paid. This fee is called Gas. In technical terms, Gas refers to the unit of measure on the amount of computational effort required to execute an operation or a smart contract. The more complex the execution operation is, the more gas is required to fulfill that operation. Gas fees are paid entirely in Ether (ETH), which is the native coin of the blockchain. The price of gas can fluctuate from time to time depending on the network demand.",
                      "ko": "이더리움(Ethereum/ETH)은 블록체인 기술에 기반한 클라우드 컴퓨팅 플랫폼 또는 프로그래밍 언어이다. 비탈릭 부테린이 개발하였다.비탈릭 부테린은 가상화폐인 비트코인에 사용된 핵심 기술인 블록체인(blockchain)에 화폐 거래 기록뿐 아니라 계약서 등의 추가 정보를 기록할 수 있다는 점에 착안하여, 전 세계 수많은 사용자들이 보유하고 있는 컴퓨팅 자원을 활용해 분산 네트워크를 구성하고, 이 플랫폼을 이용하여 SNS, 이메일, 전자투표 등 다양한 정보를 기록하는 시스템을 창안했다. 이더리움은 C++, 자바, 파이썬, GO 등 주요 프로그래밍 언어를 지원한다.이더리움을 사물 인터넷(IoT)에 적용하면 기계 간 금융 거래도 가능해진다. 예를 들어 고장난 청소로봇이 정비로봇에 돈을 내고 정비를 받고, 청소로봇은 돈을 벌기 위해 정비로봇의 집을 청소하는 것도 가능해진다.",
                      "zh": "Ethereum（以太坊）是一个平台和一种编程语言，使开发人员能够建立和发布下一代分布式应用。Ethereum 是使用甲醚作为燃料，以激励其网络的第一个图灵完备cryptocurrency。Ethereum（以太坊） 是由Vitalik Buterin的创建。该项目于2014年8月获得了美国1800万$比特币的价值及其crowdsale期间。在2016年，Ethereum（以太坊）的价格上涨超过50倍。",
                      "ja": "イーサリアム (Ethereum, ETH)・プロジェクトにより開発が進められている、分散型アプリケーション（DApps）やスマート・コントラクトを構築するためのプラットフォームの名称、及び関連するオープンソース・ソフトウェア・プロジェクトの総称である。イーサリアムでは、イーサリアム・ネットワークと呼ばれるP2Pのネットワーク上でスマート・コントラクトの履行履歴をブロックチェーンに記録していく。またイーサリアムは、スマート・コントラクトを記述するチューリング完全なプログラミング言語を持ち、ネットワーク参加者はこのネットワーク上のブロックチェーンに任意のDAppsやスマート・コントラクトを記述しそれを実行することが可能になる。ネットワーク参加者が「Ether」と呼ばれるイーサリアム内部通貨の報酬を目当てに、採掘と呼ばれるブロックチェーンへのスマート・コントラクトの履行結果の記録を行うことで、その正統性を保証していく。このような仕組みにより特定の中央管理組織に依拠せず、P2P全体を実行環境としてプログラムの実行とその結果を共有することが可能になった。"
                  },
                  "createdAt": "2023-10-31T21:55:26.652Z"
              },
              "chainId": 59144,
              "price": "2067.38"
          },
          "feeData": {
              "metabridge": {
                  "amount": "8750000000000000",
                  "asset": {
                      "address": "0x0000000000000000000000000000000000000000",
                      "assetId": "eip155:1/slip44:60",
                      "symbol": "ETH",
                      "decimals": 18,
                      "name": "Ethereum",
                      "coingeckoId": "ethereum",
                      "aggregators": [],
                      "iconUrl": "https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/native/60.png",
                      "metadata": {
                          "honeypotStatus": {},
                          "isContractVerified": false,
                          "erc20Permit": false,
                          "description": {
                              "en": "Ethereum is a global, open-source platform for decentralized applications. In other words, the vision is to create a world computer that anyone can build applications in a decentralized manner; while all states and data are distributed and publicly accessible. Ethereum supports smart contracts in which developers can write code in order to program digital value. Examples of decentralized apps (dapps) that are built on Ethereum includes tokens, non-fungible tokens, decentralized finance apps, lending protocol, decentralized exchanges, and much more.On Ethereum, all transactions and smart contract executions require a small fee to be paid. This fee is called Gas. In technical terms, Gas refers to the unit of measure on the amount of computational effort required to execute an operation or a smart contract. The more complex the execution operation is, the more gas is required to fulfill that operation. Gas fees are paid entirely in Ether (ETH), which is the native coin of the blockchain. The price of gas can fluctuate from time to time depending on the network demand.",
                              "ko": "이더리움(Ethereum/ETH)은 블록체인 기술에 기반한 클라우드 컴퓨팅 플랫폼 또는 프로그래밍 언어이다. 비탈릭 부테린이 개발하였다.비탈릭 부테린은 가상화폐인 비트코인에 사용된 핵심 기술인 블록체인(blockchain)에 화폐 거래 기록뿐 아니라 계약서 등의 추가 정보를 기록할 수 있다는 점에 착안하여, 전 세계 수많은 사용자들이 보유하고 있는 컴퓨팅 자원을 활용해 분산 네트워크를 구성하고, 이 플랫폼을 이용하여 SNS, 이메일, 전자투표 등 다양한 정보를 기록하는 시스템을 창안했다. 이더리움은 C++, 자바, 파이썬, GO 등 주요 프로그래밍 언어를 지원한다.이더리움을 사물 인터넷(IoT)에 적용하면 기계 간 금융 거래도 가능해진다. 예를 들어 고장난 청소로봇이 정비로봇에 돈을 내고 정비를 받고, 청소로봇은 돈을 벌기 위해 정비로봇의 집을 청소하는 것도 가능해진다.",
                              "zh": "Ethereum（以太坊）是一个平台和一种编程语言，使开发人员能够建立和发布下一代分布式应用。Ethereum 是使用甲醚作为燃料，以激励其网络的第一个图灵完备cryptocurrency。Ethereum（以太坊） 是由Vitalik Buterin的创建。该项目于2014年8月获得了美国1800万$比特币的价值及其crowdsale期间。在2016年，Ethereum（以太坊）的价格上涨超过50倍。",
                              "ja": "イーサリアム (Ethereum, ETH)・プロジェクトにより開発が進められている、分散型アプリケーション（DApps）やスマート・コントラクトを構築するためのプラットフォームの名称、及び関連するオープンソース・ソフトウェア・プロジェクトの総称である。イーサリアムでは、イーサリアム・ネットワークと呼ばれるP2Pのネットワーク上でスマート・コントラクトの履行履歴をブロックチェーンに記録していく。またイーサリアムは、スマート・コントラクトを記述するチューリング完全なプログラミング言語を持ち、ネットワーク参加者はこのネットワーク上のブロックチェーンに任意のDAppsやスマート・コントラクトを記述しそれを実行することが可能になる。ネットワーク参加者が「Ether」と呼ばれるイーサリアム内部通貨の報酬を目当てに、採掘と呼ばれるブロックチェーンへのスマート・コントラクトの履行結果の記録を行うことで、その正統性を保証していく。このような仕組みにより特定の中央管理組織に依拠せず、P2P全体を実行環境としてプログラムの実行とその結果を共有することが可能になった。"
                          },
                          "createdAt": "2023-10-31T22:41:58.553Z"
                      },
                      "chainId": 1,
                      "price": "2064.02"
                  }
              }
          },
          "bridgeId": "lifi",
          "bridges": [
              "stargate"
          ],
          "steps": [
              {
                  "action": "bridge",
                  "srcChainId": 1,
                  "destChainId": 59144,
                  "protocol": {
                      "name": "stargate",
                      "displayName": "StargateV2 (Fast mode)",
                      "icon": "https://raw.githubusercontent.com/lifinance/types/5685c638772f533edad80fcb210b4bb89e30a50f/src/assets/icons/bridges/stargate.png"
                  },
                  "srcAsset": {
                      "address": "0x0000000000000000000000000000000000000000",
                      "assetId": "eip155:1/slip44:60",
                      "symbol": "ETH",
                      "decimals": 18,
                      "name": "Ethereum",
                      "coingeckoId": "ethereum",
                      "aggregators": [],
                      "iconUrl": "https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/native/60.png",
                      "metadata": {
                          "honeypotStatus": {},
                          "isContractVerified": false,
                          "erc20Permit": false,
                          "description": {
                              "en": "Ethereum is a global, open-source platform for decentralized applications. In other words, the vision is to create a world computer that anyone can build applications in a decentralized manner; while all states and data are distributed and publicly accessible. Ethereum supports smart contracts in which developers can write code in order to program digital value. Examples of decentralized apps (dapps) that are built on Ethereum includes tokens, non-fungible tokens, decentralized finance apps, lending protocol, decentralized exchanges, and much more.On Ethereum, all transactions and smart contract executions require a small fee to be paid. This fee is called Gas. In technical terms, Gas refers to the unit of measure on the amount of computational effort required to execute an operation or a smart contract. The more complex the execution operation is, the more gas is required to fulfill that operation. Gas fees are paid entirely in Ether (ETH), which is the native coin of the blockchain. The price of gas can fluctuate from time to time depending on the network demand.",
                              "ko": "이더리움(Ethereum/ETH)은 블록체인 기술에 기반한 클라우드 컴퓨팅 플랫폼 또는 프로그래밍 언어이다. 비탈릭 부테린이 개발하였다.비탈릭 부테린은 가상화폐인 비트코인에 사용된 핵심 기술인 블록체인(blockchain)에 화폐 거래 기록뿐 아니라 계약서 등의 추가 정보를 기록할 수 있다는 점에 착안하여, 전 세계 수많은 사용자들이 보유하고 있는 컴퓨팅 자원을 활용해 분산 네트워크를 구성하고, 이 플랫폼을 이용하여 SNS, 이메일, 전자투표 등 다양한 정보를 기록하는 시스템을 창안했다. 이더리움은 C++, 자바, 파이썬, GO 등 주요 프로그래밍 언어를 지원한다.이더리움을 사물 인터넷(IoT)에 적용하면 기계 간 금융 거래도 가능해진다. 예를 들어 고장난 청소로봇이 정비로봇에 돈을 내고 정비를 받고, 청소로봇은 돈을 벌기 위해 정비로봇의 집을 청소하는 것도 가능해진다.",
                              "zh": "Ethereum（以太坊）是一个平台和一种编程语言，使开发人员能够建立和发布下一代分布式应用。Ethereum 是使用甲醚作为燃料，以激励其网络的第一个图灵完备cryptocurrency。Ethereum（以太坊） 是由Vitalik Buterin的创建。该项目于2014年8月获得了美国1800万$比特币的价值及其crowdsale期间。在2016年，Ethereum（以太坊）的价格上涨超过50倍。",
                              "ja": "イーサリアム (Ethereum, ETH)・プロジェクトにより開発が進められている、分散型アプリケーション（DApps）やスマート・コントラクトを構築するためのプラットフォームの名称、及び関連するオープンソース・ソフトウェア・プロジェクトの総称である。イーサリアムでは、イーサリアム・ネットワークと呼ばれるP2Pのネットワーク上でスマート・コントラクトの履行履歴をブロックチェーンに記録していく。またイーサリアムは、スマート・コントラクトを記述するチューリング完全なプログラミング言語を持ち、ネットワーク参加者はこのネットワーク上のブロックチェーンに任意のDAppsやスマート・コントラクトを記述しそれを実行することが可能になる。ネットワーク参加者が「Ether」と呼ばれるイーサリアム内部通貨の報酬を目当てに、採掘と呼ばれるブロックチェーンへのスマート・コントラクトの履行結果の記録を行うことで、その正統性を保証していく。このような仕組みにより特定の中央管理組織に依拠せず、P2P全体を実行環境としてプログラムの実行とその結果を共有することが可能になった。"
                          },
                          "createdAt": "2023-10-31T22:41:58.553Z"
                      },
                      "chainId": 1
                  },
                  "destAsset": {
                      "address": "0x0000000000000000000000000000000000000000",
                      "assetId": "eip155:59144/slip44:60",
                      "symbol": "ETH",
                      "decimals": 18,
                      "name": "Ether",
                      "coingeckoId": "ethereum",
                      "aggregators": [],
                      "iconUrl": "https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/59144/native/60.png",
                      "metadata": {
                          "honeypotStatus": {},
                          "erc20Permit": false,
                          "description": {
                              "en": "Ethereum is a global, open-source platform for decentralized applications. In other words, the vision is to create a world computer that anyone can build applications in a decentralized manner; while all states and data are distributed and publicly accessible. Ethereum supports smart contracts in which developers can write code in order to program digital value. Examples of decentralized apps (dapps) that are built on Ethereum includes tokens, non-fungible tokens, decentralized finance apps, lending protocol, decentralized exchanges, and much more.On Ethereum, all transactions and smart contract executions require a small fee to be paid. This fee is called Gas. In technical terms, Gas refers to the unit of measure on the amount of computational effort required to execute an operation or a smart contract. The more complex the execution operation is, the more gas is required to fulfill that operation. Gas fees are paid entirely in Ether (ETH), which is the native coin of the blockchain. The price of gas can fluctuate from time to time depending on the network demand.",
                              "ko": "이더리움(Ethereum/ETH)은 블록체인 기술에 기반한 클라우드 컴퓨팅 플랫폼 또는 프로그래밍 언어이다. 비탈릭 부테린이 개발하였다.비탈릭 부테린은 가상화폐인 비트코인에 사용된 핵심 기술인 블록체인(blockchain)에 화폐 거래 기록뿐 아니라 계약서 등의 추가 정보를 기록할 수 있다는 점에 착안하여, 전 세계 수많은 사용자들이 보유하고 있는 컴퓨팅 자원을 활용해 분산 네트워크를 구성하고, 이 플랫폼을 이용하여 SNS, 이메일, 전자투표 등 다양한 정보를 기록하는 시스템을 창안했다. 이더리움은 C++, 자바, 파이썬, GO 등 주요 프로그래밍 언어를 지원한다.이더리움을 사물 인터넷(IoT)에 적용하면 기계 간 금융 거래도 가능해진다. 예를 들어 고장난 청소로봇이 정비로봇에 돈을 내고 정비를 받고, 청소로봇은 돈을 벌기 위해 정비로봇의 집을 청소하는 것도 가능해진다.",
                              "zh": "Ethereum（以太坊）是一个平台和一种编程语言，使开发人员能够建立和发布下一代分布式应用。Ethereum 是使用甲醚作为燃料，以激励其网络的第一个图灵完备cryptocurrency。Ethereum（以太坊） 是由Vitalik Buterin的创建。该项目于2014年8月获得了美国1800万$比特币的价值及其crowdsale期间。在2016年，Ethereum（以太坊）的价格上涨超过50倍。",
                              "ja": "イーサリアム (Ethereum, ETH)・プロジェクトにより開発が進められている、分散型アプリケーション（DApps）やスマート・コントラクトを構築するためのプラットフォームの名称、及び関連するオープンソース・ソフトウェア・プロジェクトの総称である。イーサリアムでは、イーサリアム・ネットワークと呼ばれるP2Pのネットワーク上でスマート・コントラクトの履行履歴をブロックチェーンに記録していく。またイーサリアムは、スマート・コントラクトを記述するチューリング完全なプログラミング言語を持ち、ネットワーク参加者はこのネットワーク上のブロックチェーンに任意のDAppsやスマート・コントラクトを記述しそれを実行することが可能になる。ネットワーク参加者が「Ether」と呼ばれるイーサリアム内部通貨の報酬を目当てに、採掘と呼ばれるブロックチェーンへのスマート・コントラクトの履行結果の記録を行うことで、その正統性を保証していく。このような仕組みにより特定の中央管理組織に依拠せず、P2P全体を実行環境としてプログラムの実行とその結果を共有することが可能になった。"
                          },
                          "createdAt": "2023-10-31T21:55:26.652Z"
                      },
                      "chainId": 59144
                  },
                  "srcAmount": "991250000000000000",
                  "destAmount": "991150000000000000"
              }
          ],
          "bridgePriceData": {
              "totalFromAmountUsd": "2045.9598",
              "totalToAmountUsd": "2049.0837",
              "priceImpact": "-0.0015268628445192563"
          }
      },
      "trade": {
          "chainId": 1,
          "to": "0x0439e60F02a8900a951603950d8D4527f400C3f1",
          "from": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
          "value": "0x0de108a9966def26",
          "data": "0x3ce33bff000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000de108a9966def2600000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000000d6c6966694164617074657256320000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005400000000000000000000000001231deb6f5749ef6ce6943a275a1d3e7486f4eae0000000000000000000000001231deb6f5749ef6ce6943a275a1d3e7486f4eae000000000000000000000000000000000000000000000000000000000000e708000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000dc1a09f859b20000000000000000000000000000000000000000000000000000000000000000140000000000000000000000000000000000000000000000000001f161421c8e000000000000000000000000000e6b738da243e8fa2a0ed5915645789add5de515200000000000000000000000000000000000000000000000000000000000003e414d53077000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000002001f9ead36e9eee569306dc8c473c369321e62966d97acf3374b152710e9cbab57000000000000000000000000000000000000000000000000000000000000014000000000000000000000000000000000000000000000000000000000000001800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c80000000000000000000000000000000000000000000000000dc1a09f859b2000000000000000000000000000000000000000000000000000000000000000e70800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a7374617267617465563200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000f6d6574616d61736b2d6272696467650000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000d00000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000051f5ef09ef26000000000000000000000000000000000000000000000000000000000000000000000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c800000000000000000000000000000000000000000000000000000000000075e700000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c80000000000000000000000000000000000000000000000000dc1a09f859b2000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e00000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000012000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000b049ee8d08716b60255af3831f7ea147c6065a12fe9f67e5ef63605ac880630561d324c4d6957068fbfce99ab3e8772fc51327ca4c7177754aa0ba0f7d8c14ea1b",
          "gasLimit": 496652
      },
      "estimatedProcessingTimeInSeconds": 205
  },
  {
      "quote": {
          "requestId": "d338a601-2e17-4715-b94a-87be315d1ec8",
          "srcChainId": 1,
          "srcTokenAmount": "991250000000000000",
          "srcAsset": {
              "address": "0x0000000000000000000000000000000000000000",
              "assetId": "eip155:1/slip44:60",
              "symbol": "ETH",
              "decimals": 18,
              "name": "Ethereum",
              "coingeckoId": "ethereum",
              "aggregators": [],
              "iconUrl": "https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/native/60.png",
              "metadata": {
                  "honeypotStatus": {},
                  "isContractVerified": false,
                  "erc20Permit": false,
                  "description": {
                      "en": "Ethereum is a global, open-source platform for decentralized applications. In other words, the vision is to create a world computer that anyone can build applications in a decentralized manner; while all states and data are distributed and publicly accessible. Ethereum supports smart contracts in which developers can write code in order to program digital value. Examples of decentralized apps (dapps) that are built on Ethereum includes tokens, non-fungible tokens, decentralized finance apps, lending protocol, decentralized exchanges, and much more.On Ethereum, all transactions and smart contract executions require a small fee to be paid. This fee is called Gas. In technical terms, Gas refers to the unit of measure on the amount of computational effort required to execute an operation or a smart contract. The more complex the execution operation is, the more gas is required to fulfill that operation. Gas fees are paid entirely in Ether (ETH), which is the native coin of the blockchain. The price of gas can fluctuate from time to time depending on the network demand.",
                      "ko": "이더리움(Ethereum/ETH)은 블록체인 기술에 기반한 클라우드 컴퓨팅 플랫폼 또는 프로그래밍 언어이다. 비탈릭 부테린이 개발하였다.비탈릭 부테린은 가상화폐인 비트코인에 사용된 핵심 기술인 블록체인(blockchain)에 화폐 거래 기록뿐 아니라 계약서 등의 추가 정보를 기록할 수 있다는 점에 착안하여, 전 세계 수많은 사용자들이 보유하고 있는 컴퓨팅 자원을 활용해 분산 네트워크를 구성하고, 이 플랫폼을 이용하여 SNS, 이메일, 전자투표 등 다양한 정보를 기록하는 시스템을 창안했다. 이더리움은 C++, 자바, 파이썬, GO 등 주요 프로그래밍 언어를 지원한다.이더리움을 사물 인터넷(IoT)에 적용하면 기계 간 금융 거래도 가능해진다. 예를 들어 고장난 청소로봇이 정비로봇에 돈을 내고 정비를 받고, 청소로봇은 돈을 벌기 위해 정비로봇의 집을 청소하는 것도 가능해진다.",
                      "zh": "Ethereum（以太坊）是一个平台和一种编程语言，使开发人员能够建立和发布下一代分布式应用。Ethereum 是使用甲醚作为燃料，以激励其网络的第一个图灵完备cryptocurrency。Ethereum（以太坊） 是由Vitalik Buterin的创建。该项目于2014年8月获得了美国1800万$比特币的价值及其crowdsale期间。在2016年，Ethereum（以太坊）的价格上涨超过50倍。",
                      "ja": "イーサリアム (Ethereum, ETH)・プロジェクトにより開発が進められている、分散型アプリケーション（DApps）やスマート・コントラクトを構築するためのプラットフォームの名称、及び関連するオープンソース・ソフトウェア・プロジェクトの総称である。イーサリアムでは、イーサリアム・ネットワークと呼ばれるP2Pのネットワーク上でスマート・コントラクトの履行履歴をブロックチェーンに記録していく。またイーサリアムは、スマート・コントラクトを記述するチューリング完全なプログラミング言語を持ち、ネットワーク参加者はこのネットワーク上のブロックチェーンに任意のDAppsやスマート・コントラクトを記述しそれを実行することが可能になる。ネットワーク参加者が「Ether」と呼ばれるイーサリアム内部通貨の報酬を目当てに、採掘と呼ばれるブロックチェーンへのスマート・コントラクトの履行結果の記録を行うことで、その正統性を保証していく。このような仕組みにより特定の中央管理組織に依拠せず、P2P全体を実行環境としてプログラムの実行とその結果を共有することが可能になった。"
                  },
                  "createdAt": "2023-10-31T22:41:58.553Z"
              },
              "chainId": 1,
              "price": "2064.02"
          },
          "destChainId": 59144,
          "destTokenAmount": "990647994395006409",
          "destAsset": {
              "address": "0x0000000000000000000000000000000000000000",
              "assetId": "eip155:59144/slip44:60",
              "symbol": "ETH",
              "decimals": 18,
              "name": "Ether",
              "coingeckoId": "ethereum",
              "aggregators": [],
              "iconUrl": "https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/59144/native/60.png",
              "metadata": {
                  "honeypotStatus": {},
                  "erc20Permit": false,
                  "description": {
                      "en": "Ethereum is a global, open-source platform for decentralized applications. In other words, the vision is to create a world computer that anyone can build applications in a decentralized manner; while all states and data are distributed and publicly accessible. Ethereum supports smart contracts in which developers can write code in order to program digital value. Examples of decentralized apps (dapps) that are built on Ethereum includes tokens, non-fungible tokens, decentralized finance apps, lending protocol, decentralized exchanges, and much more.On Ethereum, all transactions and smart contract executions require a small fee to be paid. This fee is called Gas. In technical terms, Gas refers to the unit of measure on the amount of computational effort required to execute an operation or a smart contract. The more complex the execution operation is, the more gas is required to fulfill that operation. Gas fees are paid entirely in Ether (ETH), which is the native coin of the blockchain. The price of gas can fluctuate from time to time depending on the network demand.",
                      "ko": "이더리움(Ethereum/ETH)은 블록체인 기술에 기반한 클라우드 컴퓨팅 플랫폼 또는 프로그래밍 언어이다. 비탈릭 부테린이 개발하였다.비탈릭 부테린은 가상화폐인 비트코인에 사용된 핵심 기술인 블록체인(blockchain)에 화폐 거래 기록뿐 아니라 계약서 등의 추가 정보를 기록할 수 있다는 점에 착안하여, 전 세계 수많은 사용자들이 보유하고 있는 컴퓨팅 자원을 활용해 분산 네트워크를 구성하고, 이 플랫폼을 이용하여 SNS, 이메일, 전자투표 등 다양한 정보를 기록하는 시스템을 창안했다. 이더리움은 C++, 자바, 파이썬, GO 등 주요 프로그래밍 언어를 지원한다.이더리움을 사물 인터넷(IoT)에 적용하면 기계 간 금융 거래도 가능해진다. 예를 들어 고장난 청소로봇이 정비로봇에 돈을 내고 정비를 받고, 청소로봇은 돈을 벌기 위해 정비로봇의 집을 청소하는 것도 가능해진다.",
                      "zh": "Ethereum（以太坊）是一个平台和一种编程语言，使开发人员能够建立和发布下一代分布式应用。Ethereum 是使用甲醚作为燃料，以激励其网络的第一个图灵完备cryptocurrency。Ethereum（以太坊） 是由Vitalik Buterin的创建。该项目于2014年8月获得了美国1800万$比特币的价值及其crowdsale期间。在2016年，Ethereum（以太坊）的价格上涨超过50倍。",
                      "ja": "イーサリアム (Ethereum, ETH)・プロジェクトにより開発が進められている、分散型アプリケーション（DApps）やスマート・コントラクトを構築するためのプラットフォームの名称、及び関連するオープンソース・ソフトウェア・プロジェクトの総称である。イーサリアムでは、イーサリアム・ネットワークと呼ばれるP2Pのネットワーク上でスマート・コントラクトの履行履歴をブロックチェーンに記録していく。またイーサリアムは、スマート・コントラクトを記述するチューリング完全なプログラミング言語を持ち、ネットワーク参加者はこのネットワーク上のブロックチェーンに任意のDAppsやスマート・コントラクトを記述しそれを実行することが可能になる。ネットワーク参加者が「Ether」と呼ばれるイーサリアム内部通貨の報酬を目当てに、採掘と呼ばれるブロックチェーンへのスマート・コントラクトの履行結果の記録を行うことで、その正統性を保証していく。このような仕組みにより特定の中央管理組織に依拠せず、P2P全体を実行環境としてプログラムの実行とその結果を共有することが可能になった。"
                  },
                  "createdAt": "2023-10-31T21:55:26.652Z"
              },
              "chainId": 59144,
              "price": "2067.38"
          },
          "feeData": {
              "metabridge": {
                  "amount": "8750000000000000",
                  "asset": {
                      "address": "0x0000000000000000000000000000000000000000",
                      "assetId": "eip155:1/slip44:60",
                      "symbol": "ETH",
                      "decimals": 18,
                      "name": "Ethereum",
                      "coingeckoId": "ethereum",
                      "aggregators": [],
                      "iconUrl": "https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/native/60.png",
                      "metadata": {
                          "honeypotStatus": {},
                          "isContractVerified": false,
                          "erc20Permit": false,
                          "description": {
                              "en": "Ethereum is a global, open-source platform for decentralized applications. In other words, the vision is to create a world computer that anyone can build applications in a decentralized manner; while all states and data are distributed and publicly accessible. Ethereum supports smart contracts in which developers can write code in order to program digital value. Examples of decentralized apps (dapps) that are built on Ethereum includes tokens, non-fungible tokens, decentralized finance apps, lending protocol, decentralized exchanges, and much more.On Ethereum, all transactions and smart contract executions require a small fee to be paid. This fee is called Gas. In technical terms, Gas refers to the unit of measure on the amount of computational effort required to execute an operation or a smart contract. The more complex the execution operation is, the more gas is required to fulfill that operation. Gas fees are paid entirely in Ether (ETH), which is the native coin of the blockchain. The price of gas can fluctuate from time to time depending on the network demand.",
                              "ko": "이더리움(Ethereum/ETH)은 블록체인 기술에 기반한 클라우드 컴퓨팅 플랫폼 또는 프로그래밍 언어이다. 비탈릭 부테린이 개발하였다.비탈릭 부테린은 가상화폐인 비트코인에 사용된 핵심 기술인 블록체인(blockchain)에 화폐 거래 기록뿐 아니라 계약서 등의 추가 정보를 기록할 수 있다는 점에 착안하여, 전 세계 수많은 사용자들이 보유하고 있는 컴퓨팅 자원을 활용해 분산 네트워크를 구성하고, 이 플랫폼을 이용하여 SNS, 이메일, 전자투표 등 다양한 정보를 기록하는 시스템을 창안했다. 이더리움은 C++, 자바, 파이썬, GO 등 주요 프로그래밍 언어를 지원한다.이더리움을 사물 인터넷(IoT)에 적용하면 기계 간 금융 거래도 가능해진다. 예를 들어 고장난 청소로봇이 정비로봇에 돈을 내고 정비를 받고, 청소로봇은 돈을 벌기 위해 정비로봇의 집을 청소하는 것도 가능해진다.",
                              "zh": "Ethereum（以太坊）是一个平台和一种编程语言，使开发人员能够建立和发布下一代分布式应用。Ethereum 是使用甲醚作为燃料，以激励其网络的第一个图灵完备cryptocurrency。Ethereum（以太坊） 是由Vitalik Buterin的创建。该项目于2014年8月获得了美国1800万$比特币的价值及其crowdsale期间。在2016年，Ethereum（以太坊）的价格上涨超过50倍。",
                              "ja": "イーサリアム (Ethereum, ETH)・プロジェクトにより開発が進められている、分散型アプリケーション（DApps）やスマート・コントラクトを構築するためのプラットフォームの名称、及び関連するオープンソース・ソフトウェア・プロジェクトの総称である。イーサリアムでは、イーサリアム・ネットワークと呼ばれるP2Pのネットワーク上でスマート・コントラクトの履行履歴をブロックチェーンに記録していく。またイーサリアムは、スマート・コントラクトを記述するチューリング完全なプログラミング言語を持ち、ネットワーク参加者はこのネットワーク上のブロックチェーンに任意のDAppsやスマート・コントラクトを記述しそれを実行することが可能になる。ネットワーク参加者が「Ether」と呼ばれるイーサリアム内部通貨の報酬を目当てに、採掘と呼ばれるブロックチェーンへのスマート・コントラクトの履行結果の記録を行うことで、その正統性を保証していく。このような仕組みにより特定の中央管理組織に依拠せず、P2P全体を実行環境としてプログラムの実行とその結果を共有することが可能になった。"
                          },
                          "createdAt": "2023-10-31T22:41:58.553Z"
                      },
                      "chainId": 1,
                      "price": "2064.02"
                  }
              }
          },
          "bridgeId": "lifi",
          "bridges": [
              "hop"
          ],
          "steps": [
              {
                  "action": "bridge",
                  "srcChainId": 1,
                  "destChainId": 59144,
                  "protocol": {
                      "name": "hop",
                      "displayName": "Hop",
                      "icon": "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/bridges/hop.png"
                  },
                  "srcAsset": {
                      "address": "0x0000000000000000000000000000000000000000",
                      "assetId": "eip155:1/slip44:60",
                      "symbol": "ETH",
                      "decimals": 18,
                      "name": "Ethereum",
                      "coingeckoId": "ethereum",
                      "aggregators": [],
                      "iconUrl": "https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/native/60.png",
                      "metadata": {
                          "honeypotStatus": {},
                          "isContractVerified": false,
                          "erc20Permit": false,
                          "description": {
                              "en": "Ethereum is a global, open-source platform for decentralized applications. In other words, the vision is to create a world computer that anyone can build applications in a decentralized manner; while all states and data are distributed and publicly accessible. Ethereum supports smart contracts in which developers can write code in order to program digital value. Examples of decentralized apps (dapps) that are built on Ethereum includes tokens, non-fungible tokens, decentralized finance apps, lending protocol, decentralized exchanges, and much more.On Ethereum, all transactions and smart contract executions require a small fee to be paid. This fee is called Gas. In technical terms, Gas refers to the unit of measure on the amount of computational effort required to execute an operation or a smart contract. The more complex the execution operation is, the more gas is required to fulfill that operation. Gas fees are paid entirely in Ether (ETH), which is the native coin of the blockchain. The price of gas can fluctuate from time to time depending on the network demand.",
                              "ko": "이더리움(Ethereum/ETH)은 블록체인 기술에 기반한 클라우드 컴퓨팅 플랫폼 또는 프로그래밍 언어이다. 비탈릭 부테린이 개발하였다.비탈릭 부테린은 가상화폐인 비트코인에 사용된 핵심 기술인 블록체인(blockchain)에 화폐 거래 기록뿐 아니라 계약서 등의 추가 정보를 기록할 수 있다는 점에 착안하여, 전 세계 수많은 사용자들이 보유하고 있는 컴퓨팅 자원을 활용해 분산 네트워크를 구성하고, 이 플랫폼을 이용하여 SNS, 이메일, 전자투표 등 다양한 정보를 기록하는 시스템을 창안했다. 이더리움은 C++, 자바, 파이썬, GO 등 주요 프로그래밍 언어를 지원한다.이더리움을 사물 인터넷(IoT)에 적용하면 기계 간 금융 거래도 가능해진다. 예를 들어 고장난 청소로봇이 정비로봇에 돈을 내고 정비를 받고, 청소로봇은 돈을 벌기 위해 정비로봇의 집을 청소하는 것도 가능해진다.",
                              "zh": "Ethereum（以太坊）是一个平台和一种编程语言，使开发人员能够建立和发布下一代分布式应用。Ethereum 是使用甲醚作为燃料，以激励其网络的第一个图灵完备cryptocurrency。Ethereum（以太坊） 是由Vitalik Buterin的创建。该项目于2014年8月获得了美国1800万$比特币的价值及其crowdsale期间。在2016年，Ethereum（以太坊）的价格上涨超过50倍。",
                              "ja": "イーサリアム (Ethereum, ETH)・プロジェクトにより開発が進められている、分散型アプリケーション（DApps）やスマート・コントラクトを構築するためのプラットフォームの名称、及び関連するオープンソース・ソフトウェア・プロジェクトの総称である。イーサリアムでは、イーサリアム・ネットワークと呼ばれるP2Pのネットワーク上でスマート・コントラクトの履行履歴をブロックチェーンに記録していく。またイーサリアムは、スマート・コントラクトを記述するチューリング完全なプログラミング言語を持ち、ネットワーク参加者はこのネットワーク上のブロックチェーンに任意のDAppsやスマート・コントラクトを記述しそれを実行することが可能になる。ネットワーク参加者が「Ether」と呼ばれるイーサリアム内部通貨の報酬を目当てに、採掘と呼ばれるブロックチェーンへのスマート・コントラクトの履行結果の記録を行うことで、その正統性を保証していく。このような仕組みにより特定の中央管理組織に依拠せず、P2P全体を実行環境としてプログラムの実行とその結果を共有することが可能になった。"
                          },
                          "createdAt": "2023-10-31T22:41:58.553Z"
                      },
                      "chainId": 1
                  },
                  "destAsset": {
                      "address": "0x0000000000000000000000000000000000000000",
                      "assetId": "eip155:59144/slip44:60",
                      "symbol": "ETH",
                      "decimals": 18,
                      "name": "Ether",
                      "coingeckoId": "ethereum",
                      "aggregators": [],
                      "iconUrl": "https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/59144/native/60.png",
                      "metadata": {
                          "honeypotStatus": {},
                          "erc20Permit": false,
                          "description": {
                              "en": "Ethereum is a global, open-source platform for decentralized applications. In other words, the vision is to create a world computer that anyone can build applications in a decentralized manner; while all states and data are distributed and publicly accessible. Ethereum supports smart contracts in which developers can write code in order to program digital value. Examples of decentralized apps (dapps) that are built on Ethereum includes tokens, non-fungible tokens, decentralized finance apps, lending protocol, decentralized exchanges, and much more.On Ethereum, all transactions and smart contract executions require a small fee to be paid. This fee is called Gas. In technical terms, Gas refers to the unit of measure on the amount of computational effort required to execute an operation or a smart contract. The more complex the execution operation is, the more gas is required to fulfill that operation. Gas fees are paid entirely in Ether (ETH), which is the native coin of the blockchain. The price of gas can fluctuate from time to time depending on the network demand.",
                              "ko": "이더리움(Ethereum/ETH)은 블록체인 기술에 기반한 클라우드 컴퓨팅 플랫폼 또는 프로그래밍 언어이다. 비탈릭 부테린이 개발하였다.비탈릭 부테린은 가상화폐인 비트코인에 사용된 핵심 기술인 블록체인(blockchain)에 화폐 거래 기록뿐 아니라 계약서 등의 추가 정보를 기록할 수 있다는 점에 착안하여, 전 세계 수많은 사용자들이 보유하고 있는 컴퓨팅 자원을 활용해 분산 네트워크를 구성하고, 이 플랫폼을 이용하여 SNS, 이메일, 전자투표 등 다양한 정보를 기록하는 시스템을 창안했다. 이더리움은 C++, 자바, 파이썬, GO 등 주요 프로그래밍 언어를 지원한다.이더리움을 사물 인터넷(IoT)에 적용하면 기계 간 금융 거래도 가능해진다. 예를 들어 고장난 청소로봇이 정비로봇에 돈을 내고 정비를 받고, 청소로봇은 돈을 벌기 위해 정비로봇의 집을 청소하는 것도 가능해진다.",
                              "zh": "Ethereum（以太坊）是一个平台和一种编程语言，使开发人员能够建立和发布下一代分布式应用。Ethereum 是使用甲醚作为燃料，以激励其网络的第一个图灵完备cryptocurrency。Ethereum（以太坊） 是由Vitalik Buterin的创建。该项目于2014年8月获得了美国1800万$比特币的价值及其crowdsale期间。在2016年，Ethereum（以太坊）的价格上涨超过50倍。",
                              "ja": "イーサリアム (Ethereum, ETH)・プロジェクトにより開発が進められている、分散型アプリケーション（DApps）やスマート・コントラクトを構築するためのプラットフォームの名称、及び関連するオープンソース・ソフトウェア・プロジェクトの総称である。イーサリアムでは、イーサリアム・ネットワークと呼ばれるP2Pのネットワーク上でスマート・コントラクトの履行履歴をブロックチェーンに記録していく。またイーサリアムは、スマート・コントラクトを記述するチューリング完全なプログラミング言語を持ち、ネットワーク参加者はこのネットワーク上のブロックチェーンに任意のDAppsやスマート・コントラクトを記述しそれを実行することが可能になる。ネットワーク参加者が「Ether」と呼ばれるイーサリアム内部通貨の報酬を目当てに、採掘と呼ばれるブロックチェーンへのスマート・コントラクトの履行結果の記録を行うことで、その正統性を保証していく。このような仕組みにより特定の中央管理組織に依拠せず、P2P全体を実行環境としてプログラムの実行とその結果を共有することが可能になった。"
                          },
                          "createdAt": "2023-10-31T21:55:26.652Z"
                      },
                      "chainId": 59144
                  },
                  "srcAmount": "991250000000000000",
                  "destAmount": "990647994395006409"
              }
          ],
          "bridgePriceData": {
              "totalFromAmountUsd": "2045.9598",
              "totalToAmountUsd": "2048.0459",
              "priceImpact": "-0.0010196192515610461"
          }
      },
      "trade": {
          "chainId": 1,
          "to": "0x0439e60F02a8900a951603950d8D4527f400C3f1",
          "from": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
          "value": "0x0de0b6b3a7640000",
          "data": "0x3ce33bff000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000de0b6b3a764000000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000000d6c6966694164617074657256320000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001c00000000000000000000000006ef81a18e1e432c289dc0d1a670b78e8bbf9aa350000000000000000000000006ef81a18e1e432c289dc0d1a670b78e8bbf9aa35000000000000000000000000000000000000000000000000000000000000e708000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000dc1a09f859b20000000000000000000000000000000000000000000000000000000000000000140000000000000000000000000000000000000000000000000001f161421c8e000000000000000000000000000e6b738da243e8fa2a0ed5915645789add5de5152000000000000000000000000000000000000000000000000000000000000006c1223354c1cafdc982fe50a5a70997970c51812dc3a010c7d01b50e0d17dc79c80000e70800000000000000000dade4281e59c651710bda329b2a6224e4b44833de30f38e7f81d56400000000000000000000763bfbd22000b8901acb165ed027e32754e0ffe830802919727f000000000000000000000000000000000000000001689d9f37b6917c9e29f56315c379275e839531d36d5710ed1959af47b6a1ef3c15a0b1491f51a6b63f8d7398e7524435578a81301515e1d6c8bf11846e5db21b",
          "gasLimit": 193376
      },
      "estimatedProcessingTimeInSeconds": 1200
  },
  {
      "quote": {
          "requestId": "373d2fc6e58cdf9dc96cbc3735192033",
          "srcChainId": 1,
          "srcTokenAmount": "991250000000000000",
          "srcAsset": {
              "address": "0x0000000000000000000000000000000000000000",
              "assetId": "eip155:1/slip44:60",
              "symbol": "ETH",
              "decimals": 18,
              "name": "Ethereum",
              "coingeckoId": "ethereum",
              "aggregators": [],
              "iconUrl": "https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/native/60.png",
              "metadata": {
                  "honeypotStatus": {},
                  "isContractVerified": false,
                  "erc20Permit": false,
                  "description": {
                      "en": "Ethereum is a global, open-source platform for decentralized applications. In other words, the vision is to create a world computer that anyone can build applications in a decentralized manner; while all states and data are distributed and publicly accessible. Ethereum supports smart contracts in which developers can write code in order to program digital value. Examples of decentralized apps (dapps) that are built on Ethereum includes tokens, non-fungible tokens, decentralized finance apps, lending protocol, decentralized exchanges, and much more.On Ethereum, all transactions and smart contract executions require a small fee to be paid. This fee is called Gas. In technical terms, Gas refers to the unit of measure on the amount of computational effort required to execute an operation or a smart contract. The more complex the execution operation is, the more gas is required to fulfill that operation. Gas fees are paid entirely in Ether (ETH), which is the native coin of the blockchain. The price of gas can fluctuate from time to time depending on the network demand.",
                      "ko": "이더리움(Ethereum/ETH)은 블록체인 기술에 기반한 클라우드 컴퓨팅 플랫폼 또는 프로그래밍 언어이다. 비탈릭 부테린이 개발하였다.비탈릭 부테린은 가상화폐인 비트코인에 사용된 핵심 기술인 블록체인(blockchain)에 화폐 거래 기록뿐 아니라 계약서 등의 추가 정보를 기록할 수 있다는 점에 착안하여, 전 세계 수많은 사용자들이 보유하고 있는 컴퓨팅 자원을 활용해 분산 네트워크를 구성하고, 이 플랫폼을 이용하여 SNS, 이메일, 전자투표 등 다양한 정보를 기록하는 시스템을 창안했다. 이더리움은 C++, 자바, 파이썬, GO 등 주요 프로그래밍 언어를 지원한다.이더리움을 사물 인터넷(IoT)에 적용하면 기계 간 금융 거래도 가능해진다. 예를 들어 고장난 청소로봇이 정비로봇에 돈을 내고 정비를 받고, 청소로봇은 돈을 벌기 위해 정비로봇의 집을 청소하는 것도 가능해진다.",
                      "zh": "Ethereum（以太坊）是一个平台和一种编程语言，使开发人员能够建立和发布下一代分布式应用。Ethereum 是使用甲醚作为燃料，以激励其网络的第一个图灵完备cryptocurrency。Ethereum（以太坊） 是由Vitalik Buterin的创建。该项目于2014年8月获得了美国1800万$比特币的价值及其crowdsale期间。在2016年，Ethereum（以太坊）的价格上涨超过50倍。",
                      "ja": "イーサリアム (Ethereum, ETH)・プロジェクトにより開発が進められている、分散型アプリケーション（DApps）やスマート・コントラクトを構築するためのプラットフォームの名称、及び関連するオープンソース・ソフトウェア・プロジェクトの総称である。イーサリアムでは、イーサリアム・ネットワークと呼ばれるP2Pのネットワーク上でスマート・コントラクトの履行履歴をブロックチェーンに記録していく。またイーサリアムは、スマート・コントラクトを記述するチューリング完全なプログラミング言語を持ち、ネットワーク参加者はこのネットワーク上のブロックチェーンに任意のDAppsやスマート・コントラクトを記述しそれを実行することが可能になる。ネットワーク参加者が「Ether」と呼ばれるイーサリアム内部通貨の報酬を目当てに、採掘と呼ばれるブロックチェーンへのスマート・コントラクトの履行結果の記録を行うことで、その正統性を保証していく。このような仕組みにより特定の中央管理組織に依拠せず、P2P全体を実行環境としてプログラムの実行とその結果を共有することが可能になった。"
                  },
                  "createdAt": "2023-10-31T22:41:58.553Z"
              },
              "chainId": 1,
              "price": "2064.08404337"
          },
          "destChainId": 59144,
          "destTokenAmount": "990567451543810688",
          "destAsset": {
              "address": "0x0000000000000000000000000000000000000000",
              "assetId": "eip155:59144/slip44:60",
              "symbol": "ETH",
              "decimals": 18,
              "name": "Ether",
              "coingeckoId": "ethereum",
              "aggregators": [],
              "iconUrl": "https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/59144/native/60.png",
              "metadata": {
                  "honeypotStatus": {},
                  "erc20Permit": false,
                  "description": {
                      "en": "Ethereum is a global, open-source platform for decentralized applications. In other words, the vision is to create a world computer that anyone can build applications in a decentralized manner; while all states and data are distributed and publicly accessible. Ethereum supports smart contracts in which developers can write code in order to program digital value. Examples of decentralized apps (dapps) that are built on Ethereum includes tokens, non-fungible tokens, decentralized finance apps, lending protocol, decentralized exchanges, and much more.On Ethereum, all transactions and smart contract executions require a small fee to be paid. This fee is called Gas. In technical terms, Gas refers to the unit of measure on the amount of computational effort required to execute an operation or a smart contract. The more complex the execution operation is, the more gas is required to fulfill that operation. Gas fees are paid entirely in Ether (ETH), which is the native coin of the blockchain. The price of gas can fluctuate from time to time depending on the network demand.",
                      "ko": "이더리움(Ethereum/ETH)은 블록체인 기술에 기반한 클라우드 컴퓨팅 플랫폼 또는 프로그래밍 언어이다. 비탈릭 부테린이 개발하였다.비탈릭 부테린은 가상화폐인 비트코인에 사용된 핵심 기술인 블록체인(blockchain)에 화폐 거래 기록뿐 아니라 계약서 등의 추가 정보를 기록할 수 있다는 점에 착안하여, 전 세계 수많은 사용자들이 보유하고 있는 컴퓨팅 자원을 활용해 분산 네트워크를 구성하고, 이 플랫폼을 이용하여 SNS, 이메일, 전자투표 등 다양한 정보를 기록하는 시스템을 창안했다. 이더리움은 C++, 자바, 파이썬, GO 등 주요 프로그래밍 언어를 지원한다.이더리움을 사물 인터넷(IoT)에 적용하면 기계 간 금융 거래도 가능해진다. 예를 들어 고장난 청소로봇이 정비로봇에 돈을 내고 정비를 받고, 청소로봇은 돈을 벌기 위해 정비로봇의 집을 청소하는 것도 가능해진다.",
                      "zh": "Ethereum（以太坊）是一个平台和一种编程语言，使开发人员能够建立和发布下一代分布式应用。Ethereum 是使用甲醚作为燃料，以激励其网络的第一个图灵完备cryptocurrency。Ethereum（以太坊） 是由Vitalik Buterin的创建。该项目于2014年8月获得了美国1800万$比特币的价值及其crowdsale期间。在2016年，Ethereum（以太坊）的价格上涨超过50倍。",
                      "ja": "イーサリアム (Ethereum, ETH)・プロジェクトにより開発が進められている、分散型アプリケーション（DApps）やスマート・コントラクトを構築するためのプラットフォームの名称、及び関連するオープンソース・ソフトウェア・プロジェクトの総称である。イーサリアムでは、イーサリアム・ネットワークと呼ばれるP2Pのネットワーク上でスマート・コントラクトの履行履歴をブロックチェーンに記録していく。またイーサリアムは、スマート・コントラクトを記述するチューリング完全なプログラミング言語を持ち、ネットワーク参加者はこのネットワーク上のブロックチェーンに任意のDAppsやスマート・コントラクトを記述しそれを実行することが可能になる。ネットワーク参加者が「Ether」と呼ばれるイーサリアム内部通貨の報酬を目当てに、採掘と呼ばれるブロックチェーンへのスマート・コントラクトの履行結果の記録を行うことで、その正統性を保証していく。このような仕組みにより特定の中央管理組織に依拠せず、P2P全体を実行環境としてプログラムの実行とその結果を共有することが可能になった。"
                  },
                  "createdAt": "2023-10-31T21:55:26.652Z"
              },
              "chainId": 59144,
              "price": "2063.33891461"
          },
          "feeData": {
              "metabridge": {
                  "amount": "8750000000000000",
                  "asset": {
                      "address": "0x0000000000000000000000000000000000000000",
                      "assetId": "eip155:1/slip44:60",
                      "symbol": "ETH",
                      "decimals": 18,
                      "name": "Ethereum",
                      "coingeckoId": "ethereum",
                      "aggregators": [],
                      "iconUrl": "https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/native/60.png",
                      "metadata": {
                          "honeypotStatus": {},
                          "isContractVerified": false,
                          "erc20Permit": false,
                          "description": {
                              "en": "Ethereum is a global, open-source platform for decentralized applications. In other words, the vision is to create a world computer that anyone can build applications in a decentralized manner; while all states and data are distributed and publicly accessible. Ethereum supports smart contracts in which developers can write code in order to program digital value. Examples of decentralized apps (dapps) that are built on Ethereum includes tokens, non-fungible tokens, decentralized finance apps, lending protocol, decentralized exchanges, and much more.On Ethereum, all transactions and smart contract executions require a small fee to be paid. This fee is called Gas. In technical terms, Gas refers to the unit of measure on the amount of computational effort required to execute an operation or a smart contract. The more complex the execution operation is, the more gas is required to fulfill that operation. Gas fees are paid entirely in Ether (ETH), which is the native coin of the blockchain. The price of gas can fluctuate from time to time depending on the network demand.",
                              "ko": "이더리움(Ethereum/ETH)은 블록체인 기술에 기반한 클라우드 컴퓨팅 플랫폼 또는 프로그래밍 언어이다. 비탈릭 부테린이 개발하였다.비탈릭 부테린은 가상화폐인 비트코인에 사용된 핵심 기술인 블록체인(blockchain)에 화폐 거래 기록뿐 아니라 계약서 등의 추가 정보를 기록할 수 있다는 점에 착안하여, 전 세계 수많은 사용자들이 보유하고 있는 컴퓨팅 자원을 활용해 분산 네트워크를 구성하고, 이 플랫폼을 이용하여 SNS, 이메일, 전자투표 등 다양한 정보를 기록하는 시스템을 창안했다. 이더리움은 C++, 자바, 파이썬, GO 등 주요 프로그래밍 언어를 지원한다.이더리움을 사물 인터넷(IoT)에 적용하면 기계 간 금융 거래도 가능해진다. 예를 들어 고장난 청소로봇이 정비로봇에 돈을 내고 정비를 받고, 청소로봇은 돈을 벌기 위해 정비로봇의 집을 청소하는 것도 가능해진다.",
                              "zh": "Ethereum（以太坊）是一个平台和一种编程语言，使开发人员能够建立和发布下一代分布式应用。Ethereum 是使用甲醚作为燃料，以激励其网络的第一个图灵完备cryptocurrency。Ethereum（以太坊） 是由Vitalik Buterin的创建。该项目于2014年8月获得了美国1800万$比特币的价值及其crowdsale期间。在2016年，Ethereum（以太坊）的价格上涨超过50倍。",
                              "ja": "イーサリアム (Ethereum, ETH)・プロジェクトにより開発が進められている、分散型アプリケーション（DApps）やスマート・コントラクトを構築するためのプラットフォームの名称、及び関連するオープンソース・ソフトウェア・プロジェクトの総称である。イーサリアムでは、イーサリアム・ネットワークと呼ばれるP2Pのネットワーク上でスマート・コントラクトの履行履歴をブロックチェーンに記録していく。またイーサリアムは、スマート・コントラクトを記述するチューリング完全なプログラミング言語を持ち、ネットワーク参加者はこのネットワーク上のブロックチェーンに任意のDAppsやスマート・コントラクトを記述しそれを実行することが可能になる。ネットワーク参加者が「Ether」と呼ばれるイーサリアム内部通貨の報酬を目当てに、採掘と呼ばれるブロックチェーンへのスマート・コントラクトの履行結果の記録を行うことで、その正統性を保証していく。このような仕組みにより特定の中央管理組織に依拠せず、P2P全体を実行環境としてプログラムの実行とその結果を共有することが可能になった。"
                          },
                          "createdAt": "2023-10-31T22:41:58.553Z"
                      },
                      "chainId": 1,
                      "price": "2064.08404337"
                  }
              }
          },
          "bridgeId": "squid",
          "bridges": [
              "axelar"
          ],
          "steps": [
              {
                  "action": "bridge",
                  "srcChainId": 1,
                  "destChainId": 59144,
                  "protocol": {
                      "name": "axelar",
                      "displayName": "Axelar"
                  },
                  "srcAsset": {
                      "address": "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
                      "chainId": 1
                  },
                  "destAsset": {
                      "address": "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
                      "chainId": 59144
                  },
                  "srcAmount": "991250000000000000",
                  "destAmount": "990567451543810688"
              }
          ],
          "bridgePriceData": {
              "totalFromAmountUsd": "2046.02",
              "totalToAmountUsd": "2043.87",
              "priceImpact": "0.0010508206175893152"
          }
      },
      "trade": {
          "chainId": 1,
          "to": "0x0439e60F02a8900a951603950d8D4527f400C3f1",
          "from": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
          "value": "0x0de0b6b3a7640000",
          "data": "0x3ce33bff000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000de0b6b3a764000000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000000e737175696441646170746572563200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002e0000000000000000000000000df4ffda22270c12d0b5b3788f1669d709476111e000000000000000000000000df4ffda22270c12d0b5b3788f1669d709476111e000000000000000000000000000000000000000000000000000000000000e708000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000dc1a09f859b20000000000000000000000000000000000000000000000000000000000000000140000000000000000000000000000000000000000000000000001f161421c8e000000000000000000000000000e6b738da243e8fa2a0ed5915645789add5de515200000000000000000000000000000000000000000000000000000000000001840d77797c00000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c800000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c8000000000000000000000000ade3867e7e2dace6fa60f21db2cc89f8fb624452000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee0000000000000000000000000000000000000000000000000000000067e284010000000000000000000000000000000000000000000000000dc1a09f859b20000000000000000000000000000000000000000000000000000dbf33d95355328000000000000000000000000000000000000000000000000000000000000000520000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000e70800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000079af3605a20ec5afd99e7478b9baad1bc19e88af9d7a4173bd0c343379b29b3e1e842be2cd504498025a51066ea93cd8783180a6895b3fb99edbda1764a8ca691c",
          "gasLimit": 139095
      },
      "estimatedProcessingTimeInSeconds": 0
  }
]
