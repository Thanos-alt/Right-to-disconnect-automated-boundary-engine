# Backend

This directory contains the Spring Boot 3 middleware for the Right to Disconnect Automated Boundary Engine.

## Key Areas

- `src/main/java/com/rtdabe/controller` - REST controllers for authentication, employees, messages, compliance, analytics, audit, and health.
- `src/main/java/com/rtdabe/service` - service-layer interfaces and implementations.
- `src/main/java/com/rtdabe/entity` - normalized JPA entities.
- `src/main/java/com/rtdabe/repository` - JPA and Mongo repositories.
- `src/main/java/com/rtdabe/config` - security, OpenAPI, cache, rate limiting, and Kafka wiring.
- `src/main/java/com/rtdabe/notification` - event-driven notification observer scaffolding.
- `src/main/java/com/rtdabe/audit` - MongoDB audit-log document model.
- `src/main/resources/db/migration` - PostgreSQL schema and seed scripts.

## Runtime Profile

- Java 21
- Spring Boot 3
- PostgreSQL
- MongoDB
- Redis
- Kafka
