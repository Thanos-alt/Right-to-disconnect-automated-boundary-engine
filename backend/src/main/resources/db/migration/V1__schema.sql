CREATE TABLE departments (
    id UUID PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    cost_center VARCHAR(80) UNIQUE,
    description TEXT
);

CREATE TABLE employees (
    id UUID PRIMARY KEY,
    employee_code VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(200) NOT NULL UNIQUE,
    department VARCHAR(120) NOT NULL,
    country_code VARCHAR(10) NOT NULL,
    timezone VARCHAR(80) NOT NULL,
    contract_type VARCHAR(80) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE country_policies (
    id UUID PRIMARY KEY,
    country_code VARCHAR(10) NOT NULL UNIQUE,
    country_name VARCHAR(120) NOT NULL,
    legal_start_time VARCHAR(8) NOT NULL,
    legal_end_time VARCHAR(8) NOT NULL,
    allow_after_hours BOOLEAN NOT NULL DEFAULT FALSE,
    fine_amount NUMERIC(12,2),
    emergency_override_allowed BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE messages (
    id UUID PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id),
    manager_id VARCHAR(100) NOT NULL,
    platform VARCHAR(30) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    status VARCHAR(30) NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL,
    deliver_at TIMESTAMP WITH TIME ZONE,
    emergency_override BOOLEAN NOT NULL DEFAULT FALSE,
    queued BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE compliance_scores (
    id UUID PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id),
    score INT NOT NULL,
    blocked_messages INT NOT NULL,
    delayed_messages INT NOT NULL,
    violations INT NOT NULL,
    last_calculated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_employees_employee_code ON employees(employee_code);
CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_messages_employee_status_sent ON messages(employee_id, status, sent_at);
CREATE INDEX idx_messages_manager_sent ON messages(manager_id, sent_at);
CREATE INDEX idx_country_policies_country_code ON country_policies(country_code);
CREATE INDEX idx_compliance_scores_employee ON compliance_scores(employee_id);
