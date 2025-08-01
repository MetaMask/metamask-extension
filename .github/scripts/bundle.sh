#!/usr/bin/env bash

# Keep this list synchronized with the environment variables used by the
# `run-build` step in `.github/workflows/run-build.yml`.
export APPLE_BETA_CLIENT_ID=""
export APPLE_FLASK_CLIENT_ID=""
export APPLE_PROD_CLIENT_ID=""
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
export GOOGLE_BETA_CLIENT_ID=""
export GOOGLE_FLASK_CLIENT_ID=""
export GOOGLE_PROD_CLIENT_ID=""
export INFURA_BETA_PROJECT_ID=""
export INFURA_FLASK_PROJECT_ID=""
export INFURA_PROD_PROJECT_ID=""
export QUICKNODE_ARBITRUM_URL=""
export QUICKNODE_AVALANCHE_URL=""
export QUICKNODE_BASE_URL=""
export QUICKNODE_LINEA_MAINNET_URL=""
export QUICKNODE_MAINNET_URL=""
export QUICKNODE_OPTIMISM_URL=""
export QUICKNODE_POLYGON_URL=""
export SEGMENT_BETA_WRITE_KEY=""
export SEGMENT_FLASK_WRITE_KEY=""
export SEGMENT_PROD_WRITE_KEY=""
export ANALYTICS_DATA_DELETION_SOURCE_ID=""
export ANALYTICS_DATA_DELETION_ENDPOINT=""
export SENTRY_DSN=""
export TZ="UTC"
export VAPID_KEY=""
export ENABLE_MV3="false"

# 1. Download and install nvm:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/179d45050be0a71fd57591b0ed8aedf9b177ba10/install.sh | bash

# 2. Activate nvm in lieu of restarting the shell
# shellcheck disable=SC1091
\. "${HOME}/.nvm/nvm.sh"

# 3. Download and install Node.js
nvm install

# 4. Enable corepack to install yarn
corepack enable

# 5. Install dependencies
yarn

# 6. Run the production build command
yarn build prod
