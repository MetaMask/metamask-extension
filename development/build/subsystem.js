const fs = require('fs')
const browserify = require('browserify');
const babelify = require('babelify');
const { finished } = require('mississippi')
const fromString = require('from2-string')

const crossBundleModuleCache = {}
const crossBundlePackageCache = {}

const bundleEntries = {
    AddressBookController: `import { AddressBookController } from '@metamask/controllers/dist/user/AddressBookController';`,
    ApprovalController: `import { ApprovalController } from '@metamask/controllers/dist/approval/ApprovalController';`,
    CurrencyRateController: `import { CurrencyRateController } from '@metamask/controllers/dist/assets/CurrencyRateController'`,
    PhishingController: `import { PhishingController } from '@metamask/controllers/dist/third-party/PhishingController'`,
    AnnouncementController: `import { AnnouncementController } from '@metamask/controllers/dist/announcement/AnnouncementController'`,
    GasFeeController: `import { GasFeeController } from '@metamask/controllers/dist/gas/GasFeeController'`,
    TokenListController: `import { TokenListController } from '@metamask/controllers/dist/assets/TokenListController'`,
    TokensController: `import { TokensController } from '@metamask/controllers/dist/assets/TokensController'`,
    TokenRatesController: `import { TokenRatesController } from '@metamask/controllers/dist/assets/TokenRatesController'`,
    CollectiblesController: `import { CollectiblesController } from '@metamask/controllers/dist/assets/CollectiblesController'`,
    AssetsContractController: `import { AssetsContractController } from '@metamask/controllers/dist/assets/AssetsContractController'`,
    CollectibleDetectionController: `import { CollectibleDetectionController } from '@metamask/controllers/dist/assets/CollectibleDetectionController'`,
    PermissionController: `import { PermissionController } from '@metamask/controllers/dist/permissions/PermissionController'`,
    SubjectMetadataController: `import { SubjectMetadataController } from '@metamask/controllers/dist/subject-metadata/SubjectMetadataController'`,
    RateLimitController: `import { RateLimitController } from '@metamask/controllers/dist/ratelimit/RateLimitController'`,
  
    EnsController: `import EnsController from './app/scripts/controllers/ens';`,
    NetworkController: `import NetworkController, { NETWORK_EVENTS } from './app/scripts/controllers/network';`,
    PreferencesController: `import PreferencesController from './app/scripts/controllers/preferences';`,
    AppStateController: `import AppStateController from './app/scripts/controllers/app-state';`,
    CachedBalancesController: `import CachedBalancesController from './app/scripts/controllers/cached-balances';`,
    AlertController: `import AlertController from './app/scripts/controllers/alert';`,
    OnboardingController: `import OnboardingController from './app/scripts/controllers/onboarding';`,
    ThreeBoxController: `import ThreeBoxController from './app/scripts/controllers/threebox';`,
    IncomingTransactionsController: `import IncomingTransactionsController from './app/scripts/controllers/incoming-transactions';`,
    MessageManager: `import MessageManager, { normalizeMsgData } from './app/scripts/lib/message-manager';`,
    DecryptMessageManager: `import DecryptMessageManager from './app/scripts/lib/decrypt-message-manager';`,
    EncryptionPublicKeyManager: `import EncryptionPublicKeyManager from './app/scripts/lib/encryption-public-key-manager';`,
    PersonalMessageManager: `import PersonalMessageManager from './app/scripts/lib/personal-message-manager';`,
    TypedMessageManager: `import TypedMessageManager from './app/scripts/lib/typed-message-manager';`,
    TransactionController: `import TransactionController from './app/scripts/controllers/transactions';`,
    DetectTokensController: `import DetectTokensController from './app/scripts/controllers/detect-tokens';`,
    SwapsController: `import SwapsController from './app/scripts/controllers/swaps';`,
    MetaMetricsController: `import MetaMetricsController from './app/scripts/controllers/metametrics';`,
  
    KeyringController: `import KeyringController from 'eth-keyring-controller';`,
    SmartTransactionsController: `import SmartTransactionsController from '@metamask/smart-transactions-controller';`,
    QRHardwareKeyring: `import { MetaMaskKeyring as QRHardwareKeyring } from '@keystonehq/metamask-airgapped-keyring';`,
  }

main()

async function main () {
  for (const [subsystemName, entryContent] of Object.entries(bundleEntries)) {
    await bundleSubsytem({ subsystemName, entryContent })
  }
}

function bundleSubsytem ({ subsystemName, entryContent }) {
  const deferred = deferredPromise()
  const bundler = browserify([
    fromString(entryContent)
  ], {
    basedir: process.cwd(),
    transform: [
      babelify,
    ],
    cache: crossBundleModuleCache,
    packageCache: crossBundlePackageCache,
  });

  const bundleFileName = `subsystem-${subsystemName}.js`

  finished(
    bundler.bundle()
      .pipe(fs.createWriteStream(bundleFileName)),
    (err) => {
      if (err) {
        deferred.reject(err)
      } else {
        deferred.resolve()
      }
    }
  )

  return deferred.promise
}

function deferredPromise () {
  let resolve, reject
  const promise = new Promise((a,b) => {
    resolve = a
    reject = b
  })
  return { resolve, reject, promise }
}