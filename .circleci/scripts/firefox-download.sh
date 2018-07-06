#!/usr/bin/env bash
FIREFOX_BINARY="firefox-58.0.tar.bz2"
echo "Checking if firefox was already downloaded"
if [ -e $FIREFOX_BINARY ]
then
    echo "$FIREFOX_BINARY found. No need to download"
else
    echo "Downloading firefox..."
    wget "https://ftp.mozilla.org/pub/firefox/releases/58.0/linux-x86_64/en-US/$FIREFOX_BINARY" \
    && tar xjf "$FIREFOX_BINARY"
    echo "firefox download complete"
fi

