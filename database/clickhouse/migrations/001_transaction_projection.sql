-- Disposable analytical projection. PostgreSQL remains authoritative.
CREATE DATABASE IF NOT EXISTS flowline_analytics;

CREATE TABLE IF NOT EXISTS flowline_analytics.transaction_projection
(
  user_id UUID,
  transaction_id UUID,
  account_id UUID,
  financial_scope LowCardinality(String),
  posted_at DateTime64(3, 'UTC'),
  amount_minor Int64,
  currency FixedString(3),
  direction LowCardinality(String),
  status LowCardinality(String),
  category LowCardinality(String),
  merchant_normalized String,
  recurring Bool,
  needs_review Bool,
  source_version UInt64,
  projected_at DateTime64(3, 'UTC') DEFAULT now64(3)
)
ENGINE = ReplacingMergeTree(source_version)
PARTITION BY toYYYYMM(posted_at)
ORDER BY (user_id, financial_scope, posted_at, transaction_id)
TTL posted_at + INTERVAL 7 YEAR
SETTINGS index_granularity = 8192;

CREATE TABLE IF NOT EXISTS flowline_analytics.monthly_cashflow
(
  user_id UUID,
  financial_scope LowCardinality(String),
  month Date,
  income_minor AggregateFunction(sum, Int64),
  spend_minor AggregateFunction(sum, Int64)
)
ENGINE = AggregatingMergeTree
PARTITION BY toYear(month)
ORDER BY (user_id, financial_scope, month);

CREATE MATERIALIZED VIEW IF NOT EXISTS flowline_analytics.monthly_cashflow_mv
TO flowline_analytics.monthly_cashflow
AS SELECT
  user_id,
  financial_scope,
  toStartOfMonth(posted_at) AS month,
  sumStateIf(amount_minor, direction = 'CREDIT' AND status = 'POSTED') AS income_minor,
  sumStateIf(amount_minor, direction = 'DEBIT' AND status = 'POSTED') AS spend_minor
FROM flowline_analytics.transaction_projection
GROUP BY user_id, financial_scope, month;
