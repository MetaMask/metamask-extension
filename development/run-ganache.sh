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

mainnet_flag='false'
while getopts 'm' flag; do
  case "${flag}" in
    m) mainnet_flag='true' ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done

if [[ "$mainnet_flag" == 'true' ]]
then
  infura_project_id=''
  while IFS= read -r line; do
    if [[ "$line" =~ INFURA_PROJECT_ID=([a-z0-9]+) ]]
    then
      infura_project_id=${BASH_REMATCH[1]}
    fi
  done < .metamaskrc
  # shellcheck disable=SC2086
  $ganache_cli --fork https://mainnet.infura.io/v3/${infura_project_id} --chain.chainId 1 --mnemonic "$seed_phrase" -e 1000 &
else
  # shellcheck disable=SC2086
  $ganache_cli --chain.vmErrorsOnRPCResponse false --networkId 1337 --mnemonic "$seed_phrase" ${GANACHE_ARGS:-} &
fi

child=$!
wait "$child"
