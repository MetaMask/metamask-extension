#!/usr/bin/env bash

echo 'copy zip files to server...'
ssh bft 'mkdir -p /home/centos/metamask'
scp test/e2e/contract-test/* bft:/home/centos/metamask
ssh bft 'mv /home/centos/metamask/index.html /home/centos/metamask/contract.html'
scp builds/conflux-portal-* bft:/home/centos/metamask
scp docs/alpha-test-page.html bft:/home/centos/metamask
ssh bft 'sudo mv /home/centos/metamask/* /www/metamask/ && sudo mv /www/metamask/alpha-test-page.html /www/metamask/index.html'
