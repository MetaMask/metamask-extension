#!/usr/bin/env bash
set -x

# install acl tools
sudo apt-get install acl

# create user "buildtask"
sudo useradd buildtask

# set file perms for the project dir
setfacl -R -m u:buildtask:r ~/.nvmrc
setfacl -R -m u:buildtask:rw ui/app/css/output
setfacl -R -m u:buildtask:rw builds
setfacl -R -m u:buildtask:rw dist

# run build script as user "buildtask"
sudo runuser -u buildtask -- yarn dist