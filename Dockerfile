# syntax=docker/dockerfile:experimental

# * summary
# docker file using docker buildkit's target feature to speed up building images

# ** toc:
# *** 1
# base
# shellcheck @
# *** 2
# base -> audit-deps
# base -> prep-deps
# *** 3
# base -> prep-deps -> prep-deps-with-files
# base -> prep-deps -> prep-deps-with-prod-files
# base -> prep-deps -> test-lint-lockfile @
# base -> prep-deps -> (browsers) prep-deps-browser
# base -> prep-deps -> prep-test
# *** 4
# base -> prep-deps -> prep-deps-with-prod-files -> prep-build
# base -> prep-deps -> prep-deps-with-prod-files -> prep-build-storybook @
# base -> prep-deps -> prep-deps-with-files -> test-lint @
# base -> prep-deps -> prep-deps-browser -> prep-build-test
# base -> prep-deps -> prep-deps-browser -> prep-test-flat
# base -> prep-deps -> prep-test -> test-unit @
# base -> prep-deps -> prep-test -> test-unit-global @
# *** 5
# base -> prep-deps -> prep-deps-with-prod-files -> prep-build -> test-mozilla-lint @
# base -> prep-deps -> prep-deps-browser -> prep-test-flat -> test-flat chrome/firefox
# base -> prep-deps -> prep-deps-browser -> prep-build-test -> e2e-chrome
# base -> prep-deps -> prep-deps-browser -> prep-build-test -> e2e-firefox
# base -> prep-deps -> prep-deps-browser -> prep-build-test -> benchmark

# ** code:
# *** Level 1
# **** base
FROM circleci/node:10.18.1 AS base
RUN sudo apt update && sudo apt install lsof -y && sudo rm -rf /var/lib/apt/lists/*
WORKDIR /home/circleci/portal
COPY --chown=circleci:circleci yarn.lock package.json ./

FROM buildpack-deps:stretch AS shellcheck
RUN apt update && apt install jq shellcheck -y && rm -rf /var/lib/apt/lists/*
WORKDIR /portal
COPY --chown=circleci:circleci ./test/e2e/run-web3.sh ./test/e2e/run-web3.sh
COPY --chown=circleci:circleci ./development/shellcheck.sh ./development/shellcheck.sh
COPY --chown=circleci:circleci ./development/auto-changelog.sh ./development/auto-changelog.sh
COPY --chown=circleci:circleci ./development/generate-migration.sh ./development/generate-migration.sh
COPY --chown=circleci:circleci ./development/source-map-explorer.sh ./development/source-map-explorer.sh
COPY --chown=circleci:circleci ./development/gource-viz.sh ./development/gource-viz.sh
COPY --chown=circleci:circleci ./.circleci/scripts/collect-har-artifact.sh ./.circleci/scripts/collect-har-artifact.sh
COPY --chown=circleci:circleci ./.circleci/scripts/deps-install.sh ./.circleci/scripts/deps-install.sh
COPY --chown=circleci:circleci ./development/sentry-upload-artifacts.sh ./development/sentry-upload-artifacts.sh
COPY --chown=circleci:circleci ./test/e2e/run-all.sh ./test/e2e/run-all.sh
COPY --chown=circleci:circleci ./test/e2e/run-all-parallel.sh ./test/e2e/run-all-parallel.sh
COPY --chown=circleci:circleci ./package.json ./package.json
RUN ./development/shellcheck.sh

# *** Level 2
# **** audit
FROM base AS audit-deps
COPY --chown=circleci:circleci .circleci/scripts/yarn-audit .
RUN ./yarn-audit

# **** prep-deps without browser
FROM base as prep-deps
COPY --chown=circleci:circleci .circleci/scripts/deps-install.sh .
RUN --mount=type=cache,target=/usr/local/share/.cache/yarn ./deps-install.sh
COPY --chown=circleci:circleci ./development/prepare-conflux-local-netowrk-lite.js ./development/prepare-conflux-local-netowrk-lite.js
RUN yarn test:prepare-conflux-local

# *** Level 3
# **** prep-deps-with-files without browser
FROM prep-deps as prep-deps-with-files
COPY --chown=circleci:circleci . .

RUN printf '#!/bin/sh\nexec "$@"\n' > /tmp/entrypoint-prep-deps \
  && chmod +x /tmp/entrypoint-prep-deps \
  && sudo mv /tmp/entrypoint-prep-deps /docker-entrypoint-prep-deps.sh
ENTRYPOINT ["/docker-entrypoint-prep-deps.sh"]

# **** prep-deps-with-prod-file
FROM prep-deps AS prep-deps-with-prod-files
COPY --chown=circleci:circleci gulpfile.js babel.config.js ./
COPY --chown=circleci:circleci ui ./ui
COPY --chown=circleci:circleci app ./app

# **** test-lint-lockfile
FROM prep-deps AS test-lint-lockfile
RUN yarn lint:lockfile

# **** prep-deps with browser
FROM circleci/node:10.18.1-browsers AS browser
# start xvfb automatically to avoid needing to express in circle.yml
ENV DISPLAY :99
RUN printf '#!/bin/sh\nsudo Xvfb :99 -screen 0 1280x1024x24 &\nexec "$@"\n' > /tmp/entrypoint \
  && chmod +x /tmp/entrypoint \
  && sudo mv /tmp/entrypoint /docker-entrypoint.sh

RUN sudo apt update && sudo apt install lsof -y && sudo rm -rf /var/lib/apt/lists/*

WORKDIR /home/circleci/portal

# **** install firefox
COPY --chown=circleci:circleci ./.circleci/scripts/firefox-install ./.circleci/scripts/firefox.cfg ./.circleci/scripts/
RUN ./.circleci/scripts/firefox-install

# install chrome

RUN echo 'install chrome 86'
RUN curl --silent --show-error --location --fail --retry 3 --output /tmp/google-chrome-stable_current_amd64.deb https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb \
      && (sudo dpkg -i /tmp/google-chrome-stable_current_amd64.deb || sudo apt-get -fy install)  \
      && rm -rf /tmp/google-chrome-stable_current_amd64.deb \
      && sudo sed -i 's|HERE/chrome"|HERE/chrome" --disable-setuid-sandbox --no-sandbox|g' \
           "/opt/google/chrome/google-chrome" \
      && google-chrome --version

RUN export CHROMEDRIVER_RELEASE=$(curl --location --fail --retry 3 http://chromedriver.storage.googleapis.com/LATEST_RELEASE) \
      && curl --silent --show-error --location --fail --retry 3 --output /tmp/chromedriver_linux64.zip "http://chromedriver.storage.googleapis.com/$CHROMEDRIVER_RELEASE/chromedriver_linux64.zip" \
      && cd /tmp \
      && unzip chromedriver_linux64.zip \
      && rm -rf chromedriver_linux64.zip \
      && sudo mv chromedriver /usr/local/bin/chromedriver \
      && sudo chmod +x /usr/local/bin/chromedriver \
      && chromedriver --version

# **** prep-deps with browser
FROM browser AS prep-deps-browser
ARG BUILDKITE
ARG BUILDKITE_BRANCH
ARG BUILDKITE_ORGANIZATION_SLUG
ARG BUILDKITE_REPO
ENV BUILDKITE ${BUILDKITE}
ENV BUILDKITE_BRANCH ${BUILDKITE_BRANCH}
ENV BUILDKITE_ORGANIZATION_SLUG ${BUILDKITE_ORGANIZATION_SLUG}
ENV BUILDKITE_REPO ${BUILDKITE_REPO}
COPY --chown=circleci:circleci --from=prep-deps /home/circleci/portal/ .

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["/bin/sh"]

# prep-test
FROM prep-deps AS prep-test
COPY --chown=circleci:circleci ./test/env.js ./test/env.js
COPY --chown=circleci:circleci ./test/helper.js ./test/helper.js
COPY --chown=circleci:circleci ./test/setup.js ./test/setup.js
COPY --chown=circleci:circleci babel.config.js .
COPY --chown=circleci:circleci ./ui ./ui
COPY --chown=circleci:circleci ./app ./app

# *** Level 4
# **** prep-build
FROM prep-deps-with-prod-files AS prep-build
RUN yarn dist
RUN find dist/ -type f -exec md5sum {} \; | sort -k 2

# **** prep-build-storybook
FROM prep-deps-with-prod-files AS prep-build-storybook
COPY --chown=circleci:circleci .storybook .
RUN yarn storybook:build

# **** test-lint
FROM prep-deps-with-files AS test-lint
RUN yarn lint
RUN yarn verify-locales --quiet

# **** test-unit
FROM prep-test AS test-unit
COPY --chown=circleci:circleci ./test/stub ./test/stub
COPY --chown=circleci:circleci ./test/lib ./test/lib
COPY --chown=circleci:circleci ./test/data ./test/data
COPY --chown=circleci:circleci ./test/unit ./test/unit
RUN yarn test:coverage

# **** test-unit-global
FROM prep-test AS test-unit-global
COPY --chown=circleci:circleci ./app/scripts/lib/freezeGlobals.js ./app/scripts/lib/freezeGlobals.js
COPY --chown=circleci:circleci ./test/unit-global ./test/unit-global
RUN yarn test:unit:global

# **** prep-build-test
FROM prep-deps-browser AS prep-build-test
COPY --chown=circleci:circleci gulpfile.js babel.config.js ./
COPY --chown=circleci:circleci ./app ./app
COPY --chown=circleci:circleci ./ui ./ui
RUN yarn build:test
COPY --chown=circleci:circleci ./test ./test
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["/bin/sh"]

# **** test-integration-flat
FROM prep-deps-browser AS prep-test-flat
COPY --chown=circleci:circleci ./development/genStates.js ./development/genStates.js
COPY --chown=circleci:circleci ./development/mock-dev.js ./development/mock-dev.js
COPY --chown=circleci:circleci ./development/selector.js ./development/selector.js
COPY --chown=circleci:circleci ./development/backGroundConnectionModifiers.js ./development/backGroundConnectionModifiers.js
COPY --chown=circleci:circleci ./development/states ./development/states
COPY --chown=circleci:circleci ./test/lib ./test/lib
COPY --chown=circleci:circleci ./test/data ./test/data
COPY --chown=circleci:circleci ./test/integration ./test/integration
COPY --chown=circleci:circleci ./test/flat.conf.js ./test/flat.conf.js
COPY --chown=circleci:circleci ./test/base.conf.js ./test/base.conf.js
COPY --chown=circleci:circleci gulpfile.js babel.config.js ./
COPY --chown=circleci:circleci ./app ./app
COPY --chown=circleci:circleci ./ui ./ui
RUN find ui/app/css -type f -exec md5sum {} \; | sort -k 2 > scss_checksum
RUN yarn test:integration:build
RUN yarn test:flat:build
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["/bin/sh"]

# *** Level 5
# **** test-mozilla-lint
FROM prep-build AS test-mozilla-lint
RUN NODE_OPTIONS=--max_old_space_size=3072 yarn mozilla-lint

# **** test-integration-flat
FROM prep-test-flat AS test-flat
ARG BROWSERS='["Chrome"]'
ENV BROWSERS ${BROWSERS}
RUN sudo Xvfb :99 -screen 0 1280x1024x24 & yarn run karma start test/flat.conf.js

# **** test-e2e-chrome
# FROM prep-build-test AS e2e-chrome
# ARG BUILDKITE_PARALLEL_JOB
# ARG BUILDKITE_PARALLEL_JOB_COUNT
# ENV BUILDKITE_PARALLEL_JOB ${BUILDKITE_PARALLEL_JOB}
# ENV BUILDKITE_PARALLEL_JOB_COUNT ${BUILDKITE_PARALLEL_JOB_COUNT}
# RUN sudo Xvfb :99 -screen 0 1280x1024x24 & yarn test:e2e:chrome:parallel

# **** test-e2e-firefox
# FROM prep-build-test AS e2e-firefox
# ARG BUILDKITE_PARALLEL_JOB
# ARG BUILDKITE_PARALLEL_JOB_COUNT
# ENV BUILDKITE_PARALLEL_JOB ${BUILDKITE_PARALLEL_JOB}
# ENV BUILDKITE_PARALLEL_JOB_COUNT ${BUILDKITE_PARALLEL_JOB_COUNT}
# RUN sudo Xvfb :99 -screen 0 1280x1024x24 & yarn test:e2e:firefox:parallel

# **** benchmark
# FROM prep-build-test AS benchmark
# RUN sudo Xvfb :99 -screen 0 1280x1024x24 & yarn benchmark:chrome --out test-artifacts/chrome/benchmark/pageload.json

# **** job-publish-prerelease
FROM prep-build AS prerelease
COPY --chown=circleci:circleci ./development/source-map-explorer.sh ./development/source-map-explorer.sh
COPY --chown=circleci:circleci ./.circleci/scripts/create-sesify-viz ./.circleci/scripts/create-sesify-viz
COPY --chown=circleci:circleci ./development/metamaskbot-build-announce.js ./development/metamaskbot-build-announce.js
RUN ./development/source-map-explorer.sh
RUN ./.circleci/scripts/create-sesify-viz
# RUN ./development/metamaskbot-build-announce.js
