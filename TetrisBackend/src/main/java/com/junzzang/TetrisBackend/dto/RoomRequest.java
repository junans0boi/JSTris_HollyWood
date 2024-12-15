package com.junzzang.TetrisBackend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class RoomRequest {
    @NotBlank
    private String title;
    private boolean isPrivate;
    private String password; // if isPrivate is true
    private int maxPlayers;
}
