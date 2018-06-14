#!/usr/bin/env bash

echo "Downloading firefox..."
wget https://ftp.mozilla.org/pub/firefox/releases/58.0/linux-x86_64/en-US/firefox-58.0.tar.bz2 \
&& tar xjf firefox-58.0.tar.bz2
echo "firefox download complete"
