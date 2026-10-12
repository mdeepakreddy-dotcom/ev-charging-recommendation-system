package com.evsmartcharge.auth;

import com.evsmartcharge.security.JwtService;
import com.evsmartcharge.user.User;
import com.evsmartcharge.user.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthController(UserRepository users, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> register(@Valid @RequestBody Registration request) {
        String email = request.email().trim().toLowerCase();
        String name = request.name().trim();
        if (name.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name is required.");
        }
        if (users.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists.");
        }
        User user = users.save(new User(name, email, passwordEncoder.encode(request.password())));
        return authResponse(user, "Account created successfully.");
    }

    @PostMapping("/login")
    public Map<String, Object> login(@Valid @RequestBody Login request) {
        String email = request.email().trim().toLowerCase();
        User user = users.findByEmailIgnoreCase(email)
                .filter(candidate -> passwordEncoder.matches(request.password(), candidate.getPasswordHash()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password."));
        return authResponse(user, "Login successful.");
    }

    @GetMapping("/me")
    public Map<String, Object> currentUser(java.security.Principal principal) {
        User user = users.findByEmailIgnoreCase(principal.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User account not found."));
        return Map.of("success", true, "user", userResponse(user));
    }

    private Map<String, Object> authResponse(User user, String message) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("message", message);
        response.put("token", jwtService.createToken(user));
        response.put("user", userResponse(user));
        return response;
    }

    private Map<String, Object> userResponse(User user) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", user.getId());
        response.put("name", user.getName());
        response.put("email", user.getEmail());
        response.put("createdAt", user.getCreatedAt());
        return response;
    }

    public record Registration(
            @NotBlank @Size(max = 120) String name,
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Size(min = 6, max = 72) String password) {}

    public record Login(
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank String password) {}
}
