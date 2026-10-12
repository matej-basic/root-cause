#!/bin/sh
set -e

mkdir -p /data/db

# mongod daemonizes itself (--fork) and is reparented to this script's PID;
# that PID keeps running mongod as a child even after the final `exec`
# below replaces this shell's own process image with node.
mongod --dbpath /data/db --bind_ip 127.0.0.1 --port 27017 --fork --logpath /var/log/mongod.log

# seed.js retries the Mongo connection itself, so it also serves as the
# readiness wait: it will not return until mongod accepts connections.
node /app/seed.js

exec node /app/server.js
