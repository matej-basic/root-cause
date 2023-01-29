#!/bin/bash

podman play kube froxlor.yml --down
podman play kube froxlor.yml
sudo mysql -u root froxlor < froxlor.sql