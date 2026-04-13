# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Circl** is an event-management platform organized as a monorepo with two sub-projects:

| Directory | Stack | Purpose |
|---|---|---|
| `circl/` | Spring Boot 4.0, Java 17, MySQL | REST API backend |
| `circl-ui/` | Angular 21, TypeScript 5.9 | Web frontend |

For backend-specific patterns, naming conventions, and skill references, see `circl/CLAUDE.md`.

## Commands

### Backend (`circl/`)

```bash
./mvnw spring-boot:run                                           # Run API server (localhost:8080)
./mvnw test                                                      # Run all tests
./mvnw test -Dtest=ClassName                                     # Run a single test class
./mvnw spotless:apply                                            # Format code (Palantir Java Format)
./mvnw clean spotless:apply verify                               # Full build: format + verify
./mvnw clean compile spring-boot:build-image -DskipTests         # Build Docker image
```

### Frontend (`circl-ui/`)

```bash
npm start          # Dev server at localhost:4200 (proxies API calls to localhost:8080)
npm run build      # Production build
npm test           # Unit tests with Vitest
```

## Architecture

### Backend

Domain-driven modular monolith. Each business module (`users`, `events`, `chat`, `activity`) is a bounded context structured as:

```
{module}/
├── domain/
│   ├── models/       # Pure value objects / records (no JPA)
│   ├── entities/     # @Entity (package-private)
│   ├── repositories/ # Spring Data JPA repos (package-private)
│   ├── mappers/      # Entity ↔ DTO conversions (package-private)
│   └── services/     # @Service business logic (public)
├── rest/
│   ├── controllers/  # @RestController HTTP handlers
│   └── dtos/         # *Request / *Response payloads
└── {Module}API.java  # Public facade for cross-module calls
```

Global config lives in `com.event.circl.config/`: `SecurityConfig`, `JpaConfig`, `GlobalExceptionHandler` (`@RestControllerAdvice`).

Cross-cutting utilities live in `shared/`: `BaseEntity`, `DomainException`, `ResourceNotFoundException`, `IdGenerator`, `AssertUtil`, `SpringEventPublisher`.

**Security**: Stateless JWT via Spring Security OAuth2 Resource Server (HS256). Token expiry is 24 hours. Roles: `ADMIN`, `EVENT_ORGANIZER`, `EVENT_ORGANIZER_MEMBER`, `USER`. Access control via `@PreAuthorize` at the method level.

### Frontend

Minimal Angular 21 skeleton (non-standalone components, `AppModule`-based) with routing configured. TypeScript strict mode is enabled.

### Database

MySQL required locally:

```
URL:      jdbc:mysql://localhost:3306/circl_db
User:     root
Password: password
DDL:      auto-update (Hibernate manages schema)
```

## Key Patterns

- **Encapsulation**: entities, repositories, and mappers are package-private; only services and `*API` facades are public.
- **Inter-module calls**: modules communicate only through each other's `*API` facade, never by reaching into another module's internals.
- **Commands**: business operations use `*Cmd` objects as input to services.
- **View models**: internal domain projections use `*VM`; HTTP layer uses `*Request` / `*Response`.
