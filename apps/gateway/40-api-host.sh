#!/bin/sh
# The frontend needs an absolute API URL (it uses `new URL(...)` without a base).
# On AWS the ALB DNS is only known at deploy time, so the image is built with the
# __API_HOST__ placeholder and API_HOST is injected here when the container starts.
if [ -n "${API_HOST:-}" ]; then
  find /usr/share/nginx/html -type f \( -name '*.js' -o -name '*.html' \) \
    -exec sed -i "s#__API_HOST__#${API_HOST}#g" {} +
fi
