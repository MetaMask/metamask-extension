import { EthAccountType } from '@metamask/keyring-api';
import { ApprovalRequest } from '@metamask/approval-controller';
import { Json } from '@metamask/utils';
import { BackgroundStateProxy } from '../../shared/types/metamask';
import { AccountAddress } from "../../app/scripts/controllers/account-order";
import { ETH_EOA_METHODS } from "../../shared/constants/eth-methods";
import { AlertTypes } from "../../shared/constants/alerts";
import { DEFAULT_BRIDGE_STATE } from '../../app/scripts/controllers/bridge/constants';

const mockErc20Erc20Quotes = require('./bridge/mock-quotes-erc20-erc20.json');

const ACCOUNT_ONE_ADDRESS : AccountAddress = '0x22517aca7e7899d5df9220eee48eb9b8dbea9887';
const ACCOUNT_TWO_ADDRESS : AccountAddress = '0xc1f48ad5bd8481aba84eac11df2d2bf29f09da72';
const ACCOUNT_THREE_ADDRESS : AccountAddress = '0x9dc33e6aeeea580d78d15691c1484aaf9d70eddd';
const ACCOUNT_ONE_NAME: string = "Account 1";
const ACCOUNT_TWO_NAME: string = "Account 2";
const ACCOUNT_THREE_NAME: string = "Account 3";
const ACCOUNT_THREE_ID: string = "56830faa-776a-45d3-be9d-acd8b3b72812";
const ACCOUNT_ONE_ID: string = "b7d38d3d-f195-4b68-a7a8-9152c9e458b3";
const ACCOUNT_TWO_ID: string = "d87d01dd-aed9-497e-b673-aa6cb3a8e25e";


const ACCOUNT_ONE_BALANCE: string = "0x68155a43676deb7e0";
const ZERO_BALANCE: string = "0x0";
const ACCOUNT_TWO_BALANCE: string = "0x4563918244f400000";
const ETH_MAINNET: string = "0x1";
const SEPOLIA_NET: string = "0xaa36a7";
const SEPOLIA_TESTNET: string = "0xaa3861";

const MOCK_APPROVAL_ID = "1234567890";

type ApprovalRequestData = Record<string, Json> | null;
const MOCK_PENDING_APPROVAL: ApprovalRequest<ApprovalRequestData> = {
  id: MOCK_APPROVAL_ID,
  origin: 'https://test-dapp.metamask.io',
  time: Date.now(),
  type: 'test-approval',
  requestData: {
    header: [
      {
        key: 'headerText',
        name: 'Typography',
        children: 'Success mock',
        properties: {
          variant: 'h2',
          class: 'header-mock-class',
        },
      },
    ],
    message: 'Success message',
  },
  requestState: {},  // ApprovalRequestState type
  expectsResult: false,
};

export const mockState: BackgroundStateProxy = {
  isInitialized: true,
  AccountOrderController: {
    pinnedAccountList: [
      ACCOUNT_ONE_ADDRESS
    ],
    hiddenAccountList: [],
  },
  "AccountTracker": {
    "accounts": {
      [ACCOUNT_ONE_ADDRESS]: {
        "address": ACCOUNT_ONE_ADDRESS,
        "balance": ACCOUNT_ONE_BALANCE
      },
      [ACCOUNT_THREE_ADDRESS]: {
        "address": ACCOUNT_THREE_ADDRESS,
        "balance": ZERO_BALANCE
      },
      [ACCOUNT_TWO_ADDRESS]: {
        "address": ACCOUNT_TWO_ADDRESS,
        "balance": ACCOUNT_TWO_BALANCE
      }
    },
    "accountsByChainId": {
      [ETH_MAINNET]: {
        [ACCOUNT_ONE_ADDRESS]: {
          "address": ACCOUNT_ONE_ADDRESS,
          "balance": ZERO_BALANCE
        },
        [ACCOUNT_TWO_ADDRESS]: {
          "address": ACCOUNT_TWO_ADDRESS,
          "balance": ZERO_BALANCE
        },
        [ACCOUNT_THREE_ADDRESS]: {
          "address": ACCOUNT_THREE_ADDRESS,
          "balance": ZERO_BALANCE
        }
      },
      [SEPOLIA_NET]: {
        [ACCOUNT_ONE_ADDRESS]: {
          "address": ACCOUNT_ONE_ADDRESS,
          "balance": ZERO_BALANCE
        },
        [ACCOUNT_TWO_ADDRESS]: {},
        [ACCOUNT_THREE_ADDRESS]: {}
      },
      [SEPOLIA_TESTNET]: {
        [ACCOUNT_ONE_ADDRESS]: {
          "address": ACCOUNT_ONE_ADDRESS,
          "balance": ACCOUNT_ONE_BALANCE
        },
        [ACCOUNT_THREE_ADDRESS]: {
          "address": ACCOUNT_THREE_ADDRESS,
          "balance": ZERO_BALANCE
        },
        [ACCOUNT_TWO_ADDRESS]: {
          "address": ACCOUNT_TWO_ADDRESS,
          "balance": ACCOUNT_TWO_BALANCE
        }
      }
    },
    "currentBlockGasLimit": "0x2243e7d",
    "currentBlockGasLimitByChainId": {
      [SEPOLIA_NET]: "0x223b4e4",
      [SEPOLIA_TESTNET]: "0x2243e7d"
    }
  },
  "AccountsController": {
    "internalAccounts": {
      "accounts": {
        [ACCOUNT_THREE_ADDRESS]: {
          "address": ACCOUNT_THREE_ADDRESS,
          "id": ACCOUNT_THREE_ID,
          "metadata": {
            "importTime": 1738710472865,
            "keyring": {
              "type": "HD Key Tree"
            },
            "lastSelected": 1738710472867,
            "name": ACCOUNT_THREE_NAME,
            "nameLastUpdatedAt": 1738710472984
          },
          methods: ETH_EOA_METHODS,
          "options": {},
          "scopes": [
            "eip155:0"
          ],
          type: EthAccountType.Eoa,
        },
        [ACCOUNT_ONE_ADDRESS]: {
          "address": ACCOUNT_ONE_ADDRESS,
          "id": ACCOUNT_ONE_ID,
          "metadata": {
            "importTime": 1738710364695,
            "keyring": {
              "type": "HD Key Tree"
            },
            "lastSelected": 1738710474786,
            "name": "Account 1"
          },
          methods: ETH_EOA_METHODS,
          "options": {},
          "scopes": [
            "eip155:0"
          ],
          type: EthAccountType.Eoa,
        },
        [ACCOUNT_TWO_ADDRESS]: {
          "address": ACCOUNT_TWO_ADDRESS,
          "id": ACCOUNT_TWO_ID,
          "metadata": {
            "importTime": 1738710442401,
            "keyring": {
              "type": "HD Key Tree"
            },
            "lastSelected": 1738710442403,
            "name": "Account 2",
            "nameLastUpdatedAt": 1738710442517
          },
          methods: ETH_EOA_METHODS,
          options: {},
          scopes: [
            "eip155:0"
          ],
          type: EthAccountType.Eoa,
        }
      },
      selectedAccount: ACCOUNT_ONE_ADDRESS
    }
  },
  "AddressBookController": {
    "addressBook": {
      "*": {
        [ACCOUNT_ONE_ADDRESS]: {
          "address": ACCOUNT_ONE_ADDRESS,
          "chainId": "*",
          "isEns": false,
          "memo": "",
          "name": ACCOUNT_ONE_NAME
        },
        [ACCOUNT_THREE_ADDRESS]: {
          "address": ACCOUNT_THREE_ADDRESS,
          "chainId": "*",
          "isEns": false,
          "memo": "",
          "name": ACCOUNT_THREE_NAME
        },
        [ACCOUNT_TWO_ADDRESS]: {
          "address": ACCOUNT_TWO_ADDRESS,
          "chainId": "*",
          "isEns": false,
          "memo": "",
          "name": ACCOUNT_TWO_NAME
        }
      }
    }
  },
  "AlertController": {
    "alertEnabledness": {
      [AlertTypes.smartTransactionsMigration]: true,
      [AlertTypes.unconnectedAccount]: true,
      [AlertTypes.web3ShimUsage]: true
    },
    "unconnectedAccountAlertShownOrigins": {},
    "web3ShimUsageOrigins": {}
  },
  "AnnouncementController": {
    "announcements": {
      "25": {
        "date": null,
        "id": 25,
        "isShown": false
      }
    }
  },
  "AppMetadataController": {
    "currentAppVersion": "12.10.1",
    "currentMigrationVersion": 143,
    "previousAppVersion": "",
    "previousMigrationVersion": 0
  },
  "AppStateController": {
    "browserEnvironment": {
      "browser": "chrome",
      "os": "mac"
    },
    "connectedStatusPopoverHasBeenShown": true,
    "defaultHomeActiveTabName": "activity",
    "hadAdvancedGasFeesSetPriorToMigration92_3": false,
    "lastInteractedConfirmationInfo": {
      "chainId": SEPOLIA_TESTNET,
      "id": "cf43c740-e34c-11ef-b56e-355b2551d7f7",
      "timestamp": 1738710451212
    },
    "lastViewedUserSurvey": null,
    "newPrivacyPolicyToastClickedOrClosed": null,
    "newPrivacyPolicyToastShownDate": 1738710352827,
    "nftsDetectionNoticeDismissed": false,
    "onboardingDate": 1738710353603,
    "outdatedBrowserWarningLastShown": null,
    "recoveryPhraseReminderHasBeenShown": false,
    "recoveryPhraseReminderLastShown": 1738710346079,
    "showAccountBanner": true,
    "showBetaHeader": false,
    "showNetworkBanner": true,
    "showPermissionsTour": true,
    "showTestnetMessageInDropdown": true,
    "slides": [
      {
        id: '1',
        title: 'Slide 1',
        description: 'Description 1',
        image: 'image1.jpg',
      },
      {
        id: '2',
        title: 'Slide 2',
        description: 'Description 2',
        image: 'image2.jpg',
      },
    ],
    "surveyLinkLastClickedOrClosed": null,
    "switchedNetworkNeverShowMessage": false,
    "termsOfUseLastAgreed": 1738710355542,
    "timeoutMinutes": 0,
    "trezorModel": null
  },
  "ApprovalController": {
    "pendingApprovals": {
      [MOCK_APPROVAL_ID]: MOCK_PENDING_APPROVAL
    },
    "pendingApprovalCount": 1,
    approvalFlows: [{ id: MOCK_APPROVAL_ID, loadingText: null }],
  },
  "AuthenticationController": {
    "isSignedIn": true,
    "sessionData": {
      accessToken: 'accessToken',
      expiresIn: 'expiresIn',
      profile: {
        identifierId: 'identifierId',
        profileId: 'profileId',
      },
    }
  },
  "BridgeController": {
    bridgeState: {
      bridgeState: DEFAULT_BRIDGE_STATE
    }
  },
};
