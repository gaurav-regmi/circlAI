package com.event.circl.users.rest.controllers;

import com.event.circl.config.JwtService;
import com.event.circl.users.domain.UserService;
import com.event.circl.users.domain.models.RegisterUserCmd;
import com.event.circl.users.domain.models.UserVM;
import com.event.circl.users.rest.dtos.AuthResponse;
import com.event.circl.users.rest.dtos.LoginRequest;
import com.event.circl.users.rest.dtos.RegisterUserRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    AuthController(UserService userService,
                   AuthenticationManager authenticationManager,
                   JwtService jwtService) {
        this.userService = userService;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterUserRequest request) {
        var cmd = new RegisterUserCmd(
                request.firstName(),
                request.lastName(),
                request.email(),
                request.password(),
                request.role(),
                request.bio(),
                request.location(),
                request.interests()
        );
        userService.registerUser(cmd);
        UserVM user = userService.getByEmail(request.email());
        String token = jwtService.generateToken(user.email(), user.role(), user.id());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new AuthResponse(token, user.email(), user.firstName(), user.lastName(), user.role()));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );
        UserVM user = userService.getByEmail(request.email());
        String token = jwtService.generateToken(user.email(), user.role(), user.id());
        return ResponseEntity.ok(
                new AuthResponse(token, user.email(), user.firstName(), user.lastName(), user.role()));
    }
}
