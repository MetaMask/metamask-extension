#!/usr/bin/env bash

echo "Installing firefox..."
sudo rm -r /opt/firefox
sudo mv firefox /opt/firefox58
sudo mv /usr/bin/firefox /usr/bin/firefox-old
sudo ln -s /opt/firefox58/firefox /usr/bin/firefox
echo "Firefox installed."
