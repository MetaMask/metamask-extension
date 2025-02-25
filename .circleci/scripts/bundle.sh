#!/usr/bin/env bash

export CIRCLE_BRANCH=""
export CONTENTFUL_ACCESS_SPACE_ID=""
export CONTENTFUL_ACCESS_TOKEN=""
export ETHERSCAN_API_KEY=""
export FIREBASE_API_KEY=""
export FIREBASE_APP_ID=""
export FIREBASE_AUTH_DOMAIN=""
export FIREBASE_MEASUREMENT_ID=""
export FIREBASE_MESSAGING_SENDER_ID=""
export FIREBASE_PROJECT_ID=""
export FIREBASE_STORAGE_BUCKET=""
export INFURA_BETA_PROJECT_ID=""
export INFURA_FLASK_PROJECT_ID=""
export INFURA_MMI_PROJECT_ID=""
export INFURA_PROD_PROJECT_ID=""
export INFURA_PROJECT_ID=""
export MMI_CONFIGURATION_SERVICE_URL=""
export PUBNUB_PUB_KEY=""
export SEGMENT_BETA_WRITE_KEY=""
export SEGMENT_FLASK_WRITE_KEY=""
export SEGMENT_MMI_WRITE_KEY=""
export SEGMENT_PROD_LEGACY_WRITE_KEY=""
export SEGMENT_PROD_WRITE_KEY=""
export SEGMENT_WRITE_KEY=""
export ANALYTICS_DATA_DELETION_SOURCE_ID=""
export ANALYTICS_DATA_DELETION_ENDPOINT=""
export SENTRY_AUTH_TOKEN=""
export SENTRY_DSN=""
export SENTRY_MMI_DSN=""
export SENTRY_DSN_DEV=""
export VAPID_KEY=""
export TZ="UTC"
export ENABLE_MV3="false"

# 1. Download and install nvm:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

# 2. Activate nvm in lieu of restarting the shell
# shellcheck disable=SC1091
\. "${HOME}/.nvm/nvm.sh"

# 3. Download and install Node.js 20.14.0
nvm install 20.14.0

# 4. Install Yarn v4.5.1
corepack enable
yarn set version 4.5.1

# 5. Install dependencies
yarn

# 6. Run the production build command
yarn build prod
