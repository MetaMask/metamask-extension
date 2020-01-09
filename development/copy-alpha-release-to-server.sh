#!/usr/bin/env bash

echo 'copy zip files to server...'
ssh bft 'mkdir -p /home/centos/metamask'
scp builds/metamask-* bft:/home/centos/metamask
scp docs/alpha-test-page.html bft:/home/centos/metamask
ssh bft 'sudo mv /home/centos/metamask/* /www/metamask/'
