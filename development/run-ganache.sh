#!/usr/bin/env bash

set -e
set -u
set -o pipefail

ganache_cli="$(yarn bin ganache)"
seed_phrase="${GANACHE_SEED_PHRASE:-phrase upgrade clock rough situate wedding elder clever doctor stamp excess tent}"

_term () {
    printf '%s\n' "Received SIGTERM, sending SIGKILL to Ganache"
    kill -KILL "$child" 2>/dev/null
    exit 42
}

_int () {
    printf '%s\n' "Received SIGINT, sending SIGKILL to Ganache"
    kill -KILL "$child" 2>/dev/null
    exit 42
}

trap _term SIGTERM
trap _int SIGINT

# shellcheck disable=SC2086
$ganache_cli --chain.vmErrorsOnRPCResponse false --networkId 1337 --mnemonic "$seed_phrase" ${GANACHE_ARGS:-} &

child=$!
wait "$child"
