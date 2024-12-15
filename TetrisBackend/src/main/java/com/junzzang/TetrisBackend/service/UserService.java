package com.junzzang.TetrisBackend.service;

import com.junzzang.TetrisBackend.entity.User;
import com.junzzang.TetrisBackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public User register(String username, String email, String password, String nickname) {
        if (userRepository.findByUsername(username).isPresent())
            throw new RuntimeException("이미 존재하는 사용자명입니다.");
        if (userRepository.findByNickname(nickname).isPresent())
            throw new RuntimeException("이미 존재하는 닉네임입니다.");

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setHashedPassword(passwordEncoder.encode(password));
        user.setNickname(nickname);
        user.setCreatedAt(LocalDateTime.now());

        return userRepository.save(user);
    }

    public User login(String username, String password) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        if(!passwordEncoder.matches(password, user.getHashedPassword())) {
            throw new RuntimeException("비밀번호가 올바르지 않습니다.");
        }
        return user;
    }

    public User findByUsername(String username) {
        return userRepository.findByUsername(username).orElse(null);
    }
}
