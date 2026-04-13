# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Run the application
./mvnw spring-boot:run

# Run all tests
./mvnw test

# Run a single test class
./mvnw test -Dtest=ClassName

# Format code (Palantir Java Format via Spotless)
./mvnw spotless:apply

# Full build: format + verify
./mvnw clean spotless:apply verify

# Build Docker image (skips tests)
./mvnw clean compile spring-boot:build-image -DskipTests
```

## Architecture

Circl is a Spring Boot 4.0 (Java 17) event-management REST API packaged as a WAR. It uses Spring Data JPA, Spring Security, and Spring WebMVC with Lombok.

Follow a **domain-driven modular layout** — organize by business module, not by technical layer:

```
com.event.circl/
├── CirclApplication.java          # @SpringBootApplication entry point
├── ServletInitializer.java        # WAR deployment support
├── shared/                        # Cross-cutting utilities
├── {module}/                      # One package per bounded context (e.g. users/, events/)
│   ├── config/                    # Module-specific @Configuration beans
│   ├── domain/
│   │   ├── models/                # Pure domain records/value objects (no JPA)
│   │   ├── entities/              # @Entity classes (package-private)
│   │   ├── repositories/          # Spring Data JPA repos (package-private)
│   │   ├── mappers/               # Entity ↔ DTO conversions (package-private)
│   │   └── services/              # @Service business logic
│   ├── rest/
│   │   ├── controllers/           # @RestController HTTP handlers
│   │   └── dtos/                  # *Request / *Response payloads
│   └── {Module}API.java           # Public facade for inter-module calls
└── config/
    ├── SecurityConfig.java
    ├── WebMvcConfig.java
    └── GlobalExceptionHandler.java # @RestControllerAdvice
```

### Naming conventions

| Type | Convention | Example |
|---|---|---|
| JPA entity | `*Entity` | `UserEntity` |
| Value object | domain name (record) | `Email`, `UserId` |
| Command input | `*Cmd` | `CreateUserCmd` |
| Command result | `*Result` | `LoginResult` |
| HTTP request DTO | `*Request` | `CreateUserRequest` |
| HTTP response DTO | `*Response` | `CreateUserResponse` |
| Module facade | `*API` | `UsersAPI` |

Entities, repositories, and mappers should be **package-private** — only services and the module's `*API` facade are exposed outside the module.

## Skill Reference Files

Detailed patterns and code examples live in `.agents/skills/spring-boot-skill/references/`:

| File | When to read |
|---|---|
| `code-organization.md` | Package structure and naming |
| `spring-boot-maven-config.md` | Spotless, JaCoCo, Git Commit ID plugin setup |
| `spring-data-jpa.md` | Entity and repository patterns |
| `spring-service-layer.md` | Service layer best practices |
| `spring-webmvc-rest-api.md` | REST controller patterns |
| `spring-boot-rest-api-testing.md` | MockMvc REST API tests |
| `archunit.md` | Architecture enforcement tests |
| `spring-modulith.md` | Spring Modulith modular monolith patterns |
| `taskfile.md` | Taskfile setup for simplified command aliases |
