package com.junzzang.TetrisBackend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "rooms")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class Room {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;  // MongoDB UUID 대신 Auto Increment PK
    
    @Column(nullable = false)
    private String title;

    @Column
    private String password; // nullable

    @Column(nullable = false)
    private int maxPlayers;

    @Column(nullable = false)
    private int currentPlayers;

    @Column(nullable = false)
    private String host; // host nickname

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private boolean gameStarted;

    // joinedPlayers를 JSON 형태로 컬럼에 넣거나, 별도 테이블로 관리할 수 있다.
    // 여기서는 간단하게 JSON String으로 관리하거나, 매핑용 엔티티를 만드는 방법 고민.
    @ElementCollection
    private List<String> joinedPlayers = new ArrayList<>();
}
