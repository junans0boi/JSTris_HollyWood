package com.junzzang.TetrisBackend.util;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.security.Key;

@Component
public class JwtUtil {
    private final String SECRET_KEY = "YOUR_SECRET_KEY_SHOULD_BE_LONG_ENOUGH"; // 실제 서비스에서는 안전하게 관리해야 합니다.

    private Key getSigningKey() {
        byte[] keyBytes = SECRET_KEY.getBytes();
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String createToken(String username, Duration expiry) {
        Instant now = Instant.now();
        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(now.plus(expiry)))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256) // 수정된 부분
                .compact();
    }

    public String validateTokenAndGetUsername(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(getSigningKey()) // 수정된 부분
                    .build()
                    .parseClaimsJws(token)
                    .getBody()
                    .getSubject();
        } catch(Exception e) {
            return null;
        }
    }
}
