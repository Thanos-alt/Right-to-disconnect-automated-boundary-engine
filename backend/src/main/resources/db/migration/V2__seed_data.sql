INSERT INTO departments (id, name, cost_center, description) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Engineering', 'CC-ENG', 'Platform and product engineering'),
    ('22222222-2222-2222-2222-222222222222', 'Human Resources', 'CC-HR', 'Policy, compliance, and employee relations'),
    ('33333333-3333-3333-3333-333333333333', 'Operations', 'CC-OPS', 'Operational resilience and support');

INSERT INTO employees (id, employee_code, full_name, email, department, country_code, timezone, contract_type, active, created_at, updated_at) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '101', 'Ava Patel', 'ava.patel@company.com', 'Engineering', 'IN', 'Asia/Kolkata', 'Full-time', TRUE, NOW(), NOW()),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '202', 'Claire Martin', 'claire.martin@company.com', 'Operations', 'FR', 'Europe/Paris', 'Full-time', TRUE, NOW(), NOW()),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', '303', 'Noah Williams', 'noah.williams@company.com', 'Sales', 'US', 'America/New_York', 'Shift', TRUE, NOW(), NOW());

INSERT INTO country_policies (id, country_code, country_name, legal_start_time, legal_end_time, allow_after_hours, fine_amount, emergency_override_allowed) VALUES
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'IN', 'India', '09:00:00', '18:00:00', FALSE, 0.00, TRUE),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'FR', 'France', '09:00:00', '18:00:00', FALSE, 7500.00, TRUE),
    ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'US', 'United States', '08:00:00', '17:00:00', FALSE, 0.00, TRUE);

INSERT INTO managers (id, manager_code, full_name, email, role, active) VALUES
    ('99999999-9999-9999-9999-999999999999', 'MGR-01', 'Manager A', 'manager.a@company.com', 'MANAGER', TRUE),
    ('88888888-8888-8888-8888-888888888888', 'MGR-02', 'Manager B', 'manager.b@company.com', 'HR_MANAGER', TRUE);

INSERT INTO compliance_scores (id, employee_id, score, blocked_messages, delayed_messages, violations, last_calculated_at) VALUES
    ('12121212-1212-1212-1212-121212121212', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 98, 1, 2, 1, NOW()),
    ('34343434-3434-3434-3434-343434343434', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 95, 3, 5, 3, NOW()),
    ('56565656-5656-5656-5656-565656565656', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 97, 2, 4, 2, NOW());
