#!/bin/sh
# Root Cause flag wrapper: the flag itself is read and seeded inside
# server.js at startup, since this app's store is in-memory rather than a
# separate database step. This entrypoint exists so the pattern matches
# the other labs: the container's one job before serving traffic is to
# turn the per-run flag on the shared volume into seeded application data.
set -e

exec node server.js
