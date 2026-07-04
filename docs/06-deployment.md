# 6. Deployment

## File Purpose
This document captures the initial deployment topology for the enterprise middleware.

## Deployment Model

- Docker for localized build and runtime packaging.
- Docker Compose for the full developer environment.
- Kubernetes for production orchestration.
- Nginx for reverse proxying and frontend delivery.

## Compose Services

- PostgreSQL for transactional HRMS data.
- MongoDB for audit logs.
- Redis for caching and rate limiting.
- Kafka for queued after-hours message delivery.
- Backend Spring Boot service.
- Frontend React service.

## Kubernetes Artifacts

- Backend deployment and service.
- Frontend deployment and service.
- Backend config map and secret.
- Ingress route for the dashboard.

## File Introduced In This Module

- [docs/06-deployment.md](../docs/06-deployment.md)
