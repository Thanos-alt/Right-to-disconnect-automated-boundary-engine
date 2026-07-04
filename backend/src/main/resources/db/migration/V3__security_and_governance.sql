CREATE TABLE user_accounts (
    id UUID PRIMARY KEY,
    username VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE managers (
    id UUID PRIMARY KEY,
    manager_code VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(200) NOT NULL UNIQUE,
    role VARCHAR(80) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE holiday_calendars (
    id UUID PRIMARY KEY,
    country_code VARCHAR(10) NOT NULL,
    holiday_date DATE NOT NULL,
    holiday_name VARCHAR(150) NOT NULL,
    is_public_holiday BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_user_accounts_username ON user_accounts(username);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_managers_email ON managers(email);
CREATE INDEX idx_holiday_calendars_country_date ON holiday_calendars(country_code, holiday_date);
