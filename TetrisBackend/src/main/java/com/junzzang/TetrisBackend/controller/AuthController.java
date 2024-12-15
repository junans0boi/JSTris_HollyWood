package com.junzzang.TetrisBackend.controller;

import com.junzzang.TetrisBackend.dto.LoginRequest;
import com.junzzang.TetrisBackend.dto.RegisterRequest;
import com.junzzang.TetrisBackend.dto.TokenResponse;
import com.junzzang.TetrisBackend.entity.User;
import com.junzzang.TetrisBackend.service.UserService;
import com.junzzang.TetrisBackend.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final UserService userService;
    private final JwtUtil jwtUtil;

    @PostMapping("/register")
    public ResponseEntity<TokenResponse> register(@RequestBody RegisterRequest request) {
        User user = userService.register(request.getUsername(), request.getEmail(), request.getPassword(), request.getNickname());
        String token = jwtUtil.createToken(user.getUsername(), Duration.ofMinutes(60));
        return ResponseEntity.ok(new TokenResponse(token, "bearer", user.getNickname()));
    }

    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(@RequestBody LoginRequest request) {
        User user = userService.login(request.getUsername(), request.getPassword());
        String token = jwtUtil.createToken(user.getUsername(), Duration.ofMinutes(60));
        return ResponseEntity.ok(new TokenResponse(token, "bearer", user.getNickname()));
    }
}
