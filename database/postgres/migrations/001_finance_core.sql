-- Flowline authoritative financial store. Money is always integer minor units.
BEGIN;

CREATE TABLE IF NOT EXISTS app_user (
  id uuid PRIMARY KEY,
  timezone text NOT NULL DEFAULT 'Asia/Kolkata',
  currency char(3) NOT NULL DEFAULT 'INR',
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (currency = upper(currency))
);

CREATE TABLE IF NOT EXISTS provider_consent (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES app_user(id),
  provider text NOT NULL,
  purpose_code text NOT NULL,
  status text NOT NULL CHECK (status IN ('PENDING','ACTIVE','REVOKED','EXPIRED')),
  valid_from timestamptz,
  valid_until timestamptz,
  revoked_at timestamptz,
  provider_reference_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (valid_until IS NULL OR valid_from IS NULL OR valid_until > valid_from)
);

CREATE INDEX IF NOT EXISTS consent_active_by_user ON provider_consent (user_id, provider, valid_until)
  WHERE status = 'ACTIVE';

CREATE TABLE IF NOT EXISTS financial_account (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES app_user(id),
  provider_account_ref_hash text NOT NULL,
  institution_code text NOT NULL,
  display_name text NOT NULL,
  account_type text NOT NULL CHECK (account_type IN ('SALARY','SAVINGS','WALLET')),
  financial_scope text NOT NULL CHECK (financial_scope IN ('PERSONAL','CORPORATE')),
  currency char(3) NOT NULL DEFAULT 'INR',
  balance_minor bigint NOT NULL,
  available_balance_minor bigint NOT NULL,
  source_updated_at timestamptz NOT NULL,
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider_account_ref_hash),
  CHECK (currency = upper(currency))
);

CREATE INDEX IF NOT EXISTS account_user_scope ON financial_account (user_id, financial_scope, updated_at DESC);

CREATE TABLE IF NOT EXISTS payment_card (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES app_user(id),
  account_id uuid REFERENCES financial_account(id),
  issuer text NOT NULL,
  product_name text NOT NULL,
  token_hash text NOT NULL,
  last_four char(4) NOT NULL CHECK (last_four ~ '^[0-9]{4}$'),
  kind text NOT NULL CHECK (kind IN ('DEBIT','CREDIT')),
  financial_scope text NOT NULL CHECK (financial_scope IN ('PERSONAL','CORPORATE')),
  currency char(3) NOT NULL DEFAULT 'INR',
  credit_limit_minor bigint,
  outstanding_minor bigint,
  payment_due_at timestamptz,
  payment_due_minor bigint,
  secured boolean NOT NULL DEFAULT false,
  virtual boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, token_hash),
  CHECK (credit_limit_minor IS NULL OR credit_limit_minor >= 0),
  CHECK (outstanding_minor IS NULL OR outstanding_minor >= 0),
  CHECK (payment_due_minor IS NULL OR payment_due_minor >= 0)
);

CREATE TABLE IF NOT EXISTS transaction_entry (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES app_user(id),
  account_id uuid NOT NULL REFERENCES financial_account(id),
  card_id uuid REFERENCES payment_card(id),
  provider_transaction_ref_hash text NOT NULL,
  financial_scope text NOT NULL CHECK (financial_scope IN ('PERSONAL','CORPORATE')),
  posted_at timestamptz NOT NULL,
  amount_minor bigint NOT NULL CHECK (amount_minor > 0),
  currency char(3) NOT NULL DEFAULT 'INR',
  direction text NOT NULL CHECK (direction IN ('CREDIT','DEBIT')),
  status text NOT NULL CHECK (status IN ('POSTED','PENDING','REVERSED')),
  merchant_normalized text NOT NULL,
  description_redacted text NOT NULL,
  category text NOT NULL,
  channel text NOT NULL,
  recurring boolean NOT NULL DEFAULT false,
  needs_review boolean NOT NULL DEFAULT false,
  classification_confidence numeric(5,4) NOT NULL CHECK (classification_confidence BETWEEN 0 AND 1),
  classifier_version text NOT NULL,
  ingested_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, provider_transaction_ref_hash)
);

CREATE INDEX IF NOT EXISTS transaction_timeline ON transaction_entry (user_id, financial_scope, posted_at DESC, id);
CREATE INDEX IF NOT EXISTS transaction_account_timeline ON transaction_entry (account_id, posted_at DESC, id);
CREATE INDEX IF NOT EXISTS transaction_review_queue ON transaction_entry (user_id, posted_at DESC) WHERE needs_review;
CREATE INDEX IF NOT EXISTS transaction_category_month ON transaction_entry (user_id, category, posted_at DESC) WHERE status = 'POSTED';

CREATE TABLE IF NOT EXISTS bureau_snapshot (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES app_user(id),
  consent_id uuid REFERENCES provider_consent(id),
  bureau text NOT NULL CHECK (bureau IN ('CIBIL','CRIF','EXPERIAN','EQUIFAX')),
  score smallint NOT NULL CHECK (score BETWEEN 300 AND 900),
  maximum_score smallint NOT NULL DEFAULT 900,
  factors jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(factors) = 'array'),
  pulled_at timestamptz NOT NULL,
  source_object_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, bureau, pulled_at),
  CHECK (score <= maximum_score)
);

CREATE INDEX IF NOT EXISTS bureau_latest_by_user ON bureau_snapshot (user_id, bureau, pulled_at DESC);

CREATE TABLE IF NOT EXISTS bill_obligation (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES app_user(id),
  source_id uuid,
  name text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('CREDIT_CARD','EMI','UTILITY','SUBSCRIPTION','INSURANCE')),
  financial_scope text NOT NULL CHECK (financial_scope IN ('PERSONAL','CORPORATE')),
  amount_minor bigint NOT NULL CHECK (amount_minor >= 0),
  currency char(3) NOT NULL DEFAULT 'INR',
  due_at timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('DUE','PAID','OVERDUE','AUTOPAY')),
  autopay boolean NOT NULL DEFAULT false,
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS obligation_due_queue ON bill_obligation (user_id, due_at, id) WHERE status IN ('DUE','AUTOPAY','OVERDUE');

CREATE TABLE IF NOT EXISTS recommendation_decision (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES app_user(id),
  financial_scope text NOT NULL CHECK (financial_scope IN ('PERSONAL','CORPORATE','ALL')),
  category text NOT NULL,
  priority text NOT NULL CHECK (priority IN ('CRITICAL','HIGH','MEDIUM','LOW')),
  title text NOT NULL,
  explanation text NOT NULL,
  evidence jsonb NOT NULL CHECK (jsonb_typeof(evidence) = 'array'),
  confidence numeric(5,4) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  freshness_at timestamptz NOT NULL,
  rule_version text NOT NULL,
  uncertainty text NOT NULL,
  advisory_only boolean NOT NULL DEFAULT true CHECK (advisory_only),
  status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','ACCEPTED','DISMISSED','EXPIRED')),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS recommendation_open_queue ON recommendation_decision (user_id, priority, created_at DESC) WHERE status = 'OPEN';

CREATE TABLE IF NOT EXISTS sync_job (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES app_user(id),
  idempotency_key text NOT NULL,
  request_fingerprint char(64) NOT NULL,
  source text NOT NULL,
  financial_scope text NOT NULL CHECK (financial_scope IN ('PERSONAL','CORPORATE')),
  status text NOT NULL CHECK (status IN ('PENDING','RUNNING','SUCCEEDED','FAILED','DEAD_LETTER')),
  attempts smallint NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 20),
  max_attempts smallint NOT NULL DEFAULT 3 CHECK (max_attempts BETWEEN 1 AND 20),
  next_attempt_at timestamptz,
  error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS sync_claim_queue ON sync_job (next_attempt_at, created_at) WHERE status IN ('PENDING','FAILED');

CREATE TABLE IF NOT EXISTS inbox_message (
  consumer text NOT NULL,
  message_id uuid NOT NULL,
  payload_hash char(64) NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  PRIMARY KEY (consumer, message_id)
);

CREATE TABLE IF NOT EXISTS outbox_event (
  id uuid PRIMARY KEY,
  aggregate_type text NOT NULL,
  aggregate_id uuid NOT NULL,
  event_type text NOT NULL,
  schema_version smallint NOT NULL CHECK (schema_version > 0),
  payload jsonb NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  attempts smallint NOT NULL DEFAULT 0 CHECK (attempts >= 0)
);

CREATE INDEX IF NOT EXISTS outbox_unpublished ON outbox_event (occurred_at, id) WHERE published_at IS NULL;

CREATE TABLE IF NOT EXISTS audit_event (
  sequence_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid,
  actor_type text NOT NULL,
  actor_id_hash text NOT NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  metadata_redacted jsonb NOT NULL DEFAULT '{}'::jsonb,
  correlation_id uuid NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_by_resource ON audit_event (resource_type, resource_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS audit_by_correlation ON audit_event (correlation_id, sequence_id);

COMMIT;
