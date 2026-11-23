#!/bin/sh
set -eu
umask 077
# Restrict substitution to known values. Never replace nginx's $uri/$host/etc.
: "${ORIGIN_SECRET:?ORIGIN_SECRET is required}"
case "$ORIGIN_SECRET" in *[!A-Za-z0-9_-]*) echo 'Invalid origin secret format' >&2; exit 1;; esac
[ "${#ORIGIN_SECRET}" -ge 32 ] && [ "${#ORIGIN_SECRET}" -le 128 ] || { echo 'Invalid origin secret length' >&2; exit 1; }
export RISK_UPSTREAM=${RISK_UPSTREAM:-172.17.0.1:8081}
export GATEWAY_UPSTREAM=${GATEWAY_UPSTREAM:-172.17.0.1:8080}
export LLM_UPSTREAM=${LLM_UPSTREAM:-172.17.0.1:8001}
for upstream in "$RISK_UPSTREAM" "$GATEWAY_UPSTREAM" "$LLM_UPSTREAM"; do
  case "$upstream" in *[!A-Za-z0-9.:-]*) echo 'Invalid upstream' >&2; exit 1;; esac
done
envsubst '${ORIGIN_SECRET} ${RISK_UPSTREAM} ${GATEWAY_UPSTREAM} ${LLM_UPSTREAM}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf
chmod 600 /etc/nginx/conf.d/default.conf
# Do not use nginx -T: it would print the rendered secret.
exec "$@"
