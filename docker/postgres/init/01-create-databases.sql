-- Runs once, when the postgres data volume is first initialised.
-- One database per service: services share contracts, never tables.
--   sentinel  -> risk-engine      (created by POSTGRES_DB)
--   gateway   -> payment-gateway
--   llm       -> llm-insights
CREATE DATABASE gateway;
CREATE DATABASE llm;
