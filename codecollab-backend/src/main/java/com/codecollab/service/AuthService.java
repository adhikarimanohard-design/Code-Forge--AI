package com.codecollab.service;

import com.codecollab.model.User;
import com.codecollab.repository.UserRepository;
import com.codecollab.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public Map<String, String> register(String name, String email, String password) {
        if (userRepository.existsByEmail(email))
            throw new RuntimeException("Email already registered");

        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        userRepository.save(user);

        String token = jwtUtil.generateToken(email);
        return Map.of("token", token, "name", name);
    }

    public Map<String, String> login(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(password, user.getPassword()))
            throw new RuntimeException("Invalid credentials");

        String token = jwtUtil.generateToken(email);
        return Map.of("token", token, "name", user.getName());
    }
}