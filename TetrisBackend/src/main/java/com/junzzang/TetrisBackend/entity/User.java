package com.junzzang.TetrisBackend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users") // 테이블명 users
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;
    
    @Column(unique = true, nullable = false)
    private String email;
    
    @Column(nullable = false)
    private String hashedPassword;
    
    @Column(unique = true, nullable = false)
    private String nickname;
    
    @Column(nullable = false)
    private java.time.LocalDateTime createdAt;
}
