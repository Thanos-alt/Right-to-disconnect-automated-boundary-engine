# 7. API Reference

## File Purpose
This document gives the initial REST API map for the enterprise middleware.

## Authentication

### POST /api/auth/login
- Request: `LoginRequest`
- Response: `TokenResponse`
- Status: `200 OK`
- Purpose: Authenticate a user and issue access and refresh tokens.

### POST /api/auth/refresh
- Request: `{ "refreshToken": "..." }`
- Response: `TokenResponse`
- Status: `200 OK`
- Purpose: Rotate access tokens using a valid refresh token.

## Employees

### POST /api/employees
- Request: `EmployeeRequest`
- Response: `EmployeeResponse`
- Status: `201 CREATED`
- Purpose: Register a new employee.

### GET /api/employees
- Response: `List<EmployeeResponse>`
- Status: `200 OK`
- Purpose: List employees.

### GET /api/employees/{employeeCode}
- Response: `EmployeeResponse`
- Status: `200 OK`
- Purpose: Fetch employee by code.

## Managers

### GET /api/managers
- Response: `List<Manager>`
- Status: `200 OK`
- Purpose: List managers.

## Messages

### POST /api/messages
- Request: `MessageRequest`
- Response: `MessageResponse`
- Status: `202 ACCEPTED`
- Purpose: Deliver immediately or queue based on policy evaluation.

### GET /api/messages/queue
- Response: `List<MessageResponse>`
- Status: `200 OK`
- Purpose: View queued messages.

### GET /api/messages/dashboard
- Response: `ComplianceDashboardResponse`
- Status: `200 OK`
- Purpose: Message-level compliance dashboard.

## Compliance

### GET /api/compliance/dashboard
- Response: `ComplianceDashboardResponse`
- Status: `200 OK`
- Purpose: HR compliance overview.

## Analytics

### GET /api/analytics/summary
- Response: JSON map
- Status: `200 OK`
- Purpose: Burnout and policy analytics summary.

## Audit Logs

### GET /api/audit/logs
- Response: `List<AuditLogDocument>`
- Status: `200 OK`
- Purpose: Retrieve MongoDB audit logs.

## Scheduler

### POST /api/scheduler/tick
- Response: JSON object with `releasedCount`, `released`, and `dashboard`
- Status: `200 OK`
- Purpose: Manually trigger a scheduler tick to release queued messages.

## Health

### GET /api/system/health
- Response: JSON map
- Status: `200 OK`
- Purpose: Application health check.

## File Introduced In This Module

- [docs/07-api-reference.md](../docs/07-api-reference.md)
