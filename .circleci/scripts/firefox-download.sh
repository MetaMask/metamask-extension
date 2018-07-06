#!/usr/bin/env bash
echo "Checking if firefox was already downloaded"
if [ -d "firefox" ]
then
    echo "Firefox found. No need to download"
else
    FIREFOX_BINARY="firefox-61.0.1.tar.bz2"
    echo "Downloading firefox..."
    wget "https://ftp.mozilla.org/pub/firefox/releases/58.0/linux-x86_64/en-US/$FIREFOX_BINARY" \
    && tar xjf "$FIREFOX_BINARY"
    echo "firefox download complete"
fi
