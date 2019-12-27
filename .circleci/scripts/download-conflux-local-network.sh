#!/usr/bin/env bash
set -x

mkdir -p .conflux-bin
cd .conflux-bin
wget https://github.com/Conflux-Chain/conflux-rust/releases/download/v0.1.10/conflux_ubuntu_v0.1.10.zip
unzip conflux_ubuntu_v0.1.10.zip
