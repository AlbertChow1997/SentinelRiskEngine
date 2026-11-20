ARG PROXY_IMAGE=sentinel-nginx:test
FROM ${PROXY_IMAGE}
USER root
RUN apk add --no-cache python3
USER nginx
ENTRYPOINT ["python3"]
CMD ["/tests/test_proxy.py"]
