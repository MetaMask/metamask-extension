#!/usr/bin/env bash

echo "Installing firefox..."
sudo rm -r /opt/firefox
sudo mv firefox /opt/firefox61
sudo mv /usr/bin/firefox /usr/bin/firefox-old
sudo ln -s /opt/firefox61/firefox /usr/bin/firefox
echo "Firefox installed."
