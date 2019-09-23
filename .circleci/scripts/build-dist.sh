#!/usr/bin/env bash
set -x

# create user "buildtask"
sudo useradd buildtask
# set file perms for the project dir
setfacl -R -m u:buildtask:rx ~
setfacl -R -m u:buildtask:rx ./
setfacl -R -m u:buildtask:rw builds
setfacl -R -m u:buildtask:rw dist

# run build script as user "buildtask"
sudo runuser -u buildtask -- yarn dist