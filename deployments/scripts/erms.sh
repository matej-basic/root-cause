#!/bin/bash

podman play kube erms.yml --down
podman play kube erms.yml
sudo mysql -u root ermsdb < erms.sql