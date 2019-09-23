### groups

list groups user is a member of, user defaults to current user
```
groups [user]
```

list all members of a group, group defaults to all groups
```
getent group [group]
```

create new group
```
sudo groupadd [group]
```

delete a group
```
sudo groupdel [group]
```


### users

list current user
```
whoami
```

create new user
```
sudo useradd [user]
```

delete a user
```
sudo userdel [user]
```

### access control

set control for user (`-R` for recursive)
```
setfacl -m u:username:rwx myfolder
```