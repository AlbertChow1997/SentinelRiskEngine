FROM nginx:1.30.7-alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY default.conf.template /etc/nginx/templates/default.conf.template
COPY proxy-headers.conf /etc/nginx/proxy-headers.conf
COPY entrypoint.sh /usr/local/bin/sentinel-entrypoint
RUN chmod +x /usr/local/bin/sentinel-entrypoint && mkdir -p /tmp/nginx && chown -R nginx:nginx /tmp/nginx /etc/nginx/conf.d
USER nginx
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD wget -qO- http://127.0.0.1:8080/internal-health >/dev/null || exit 1
ENTRYPOINT ["/usr/local/bin/sentinel-entrypoint"]
CMD ["nginx", "-g", "daemon off;"]
