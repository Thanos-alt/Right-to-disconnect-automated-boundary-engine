# 1. Project Overview

## Project Name
Right to Disconnect Automated Boundary Engine

## Summary
This enterprise platform enforces Right to Disconnect policies by intercepting outbound work messages, validating them against employee schedules and country laws, and delaying delivery when required.

## Primary Goals
- Prevent after-hours communication violations.
- Queue prohibited messages through Kafka.
- Deliver queued messages when the next shift begins.
- Provide compliance, analytics, and audit visibility for HR and leadership.

## Core Stack
- Backend: Java 21, Spring Boot 3, Spring Security, Spring Data JPA, Kafka, PostgreSQL, MongoDB, Redis, OAuth2, JWT, Maven.
- Frontend: React, TypeScript, Material UI, Redux Toolkit, React Router, Axios.
- Deployment: Docker, Docker Compose, Kubernetes, Nginx.

## Delivery Principle
The backend owns policy enforcement and the frontend consumes controlled APIs only.
