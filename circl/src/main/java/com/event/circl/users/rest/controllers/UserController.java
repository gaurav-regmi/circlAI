package com.event.circl.users.rest.controllers;

import com.event.circl.shared.exceptions.DomainException;
import com.event.circl.users.domain.UserService;
import com.event.circl.users.domain.models.UpdateProfileCmd;
import com.event.circl.users.domain.models.UserProfileVM;
import com.event.circl.users.domain.models.UserPublicProfileVM;
import com.event.circl.users.rest.dtos.UpdateProfileRequest;
import com.event.circl.users.rest.dtos.UserLookupResponse;
import jakarta.validation.constraints.Email;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Validated
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/lookup")
    public ResponseEntity<UserLookupResponse> lookupByEmail(
            @RequestParam @Email(message = "Must be a valid email address") String email) {
        var user = userService.getByEmail(email);
        return ResponseEntity.ok(new UserLookupResponse(user.id(), user.firstName(), user.lastName(), user.email()));
    }

    @GetMapping("/profile")
    public ResponseEntity<UserProfileVM> getProfile(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(userService.getProfile(userId(jwt)));
    }

    @PutMapping("/profile")
    public ResponseEntity<UserProfileVM> updateProfile(
            @RequestBody UpdateProfileRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        var cmd = new UpdateProfileCmd(
                userId(jwt), request.bio(), request.preferredLocation(),
                request.preferredEventType(), request.keywords(),
                request.languages(), request.interests()
        );
        return ResponseEntity.ok(userService.updateProfile(cmd));
    }

    @PostMapping("/profile/picture")
    public ResponseEntity<Void> uploadProfilePicture(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal Jwt jwt) throws IOException {
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new DomainException("Only image files are allowed");
        }
        if (file.getSize() > 5L * 1024 * 1024) {
            throw new DomainException("Image must be smaller than 5 MB");
        }
        userService.updateProfilePicture(userId(jwt), file.getBytes(), contentType);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{userId}/public-profile")
    public ResponseEntity<UserPublicProfileVM> getPublicProfile(@PathVariable String userId) {
        return ResponseEntity.ok(userService.getPublicProfile(userId));
    }

    @GetMapping("/profile/picture/{userId}")
    public ResponseEntity<?> getProfilePicture(@PathVariable String userId) {
        return userService.getProfilePictureUrl(userId)
                .map(url -> ResponseEntity.status(HttpStatus.FOUND)
                        .<Void>header(HttpHeaders.LOCATION, url).build())
                .orElse(ResponseEntity.status(HttpStatus.NO_CONTENT).build());
    }

    private String userId(Jwt jwt) {
        return jwt.getClaimAsString("userId");
    }
}
