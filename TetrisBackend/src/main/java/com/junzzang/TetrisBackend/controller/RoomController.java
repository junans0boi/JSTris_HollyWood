package com.junzzang.TetrisBackend.controller;

import com.junzzang.TetrisBackend.dto.RoomRequest;
import com.junzzang.TetrisBackend.entity.Room;
import com.junzzang.TetrisBackend.service.RoomService;
import com.junzzang.TetrisBackend.util.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;


@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class RoomController {
    private final RoomService roomService;

    @GetMapping("/rooms")
    public ResponseEntity<Map<String, Object>> getRooms() {
        Map<String, Object> response = new HashMap<>();
        response.put("rooms", roomService.getAllRooms());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/rooms")
    public ResponseEntity<?> createRoom(@RequestBody RoomRequest roomRequest, @CurrentUser String nickname) {
        Room room = roomService.createRoom(roomRequest.getTitle(), roomRequest.isPrivate(), roomRequest.getPassword(), roomRequest.getMaxPlayers(), nickname);
        Map<String, Object> response = new HashMap<>();
        response.put("room_id", room.getId());
        response.put("message", "방이 성공적으로 생성되었습니다.");
        response.put("host", room.getHost());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/rooms/{roomId}/join")
    public ResponseEntity<?> joinRoom(@PathVariable Long roomId, @RequestBody Map<String, String> req, @CurrentUser String nickname) {
        String password = req.get("password");
        Room room = roomService.joinRoom(roomId, nickname, password);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "방에 성공적으로 참여했습니다.");
        response.put("host", room.getHost());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/rooms/{roomId}/leave")
    public ResponseEntity<?> leaveRoom(@PathVariable Long roomId, @CurrentUser String nickname) {
        Room updatedRoom = roomService.leaveRoom(roomId, nickname);
        if(updatedRoom == null) {
            return ResponseEntity.ok(Map.of("message", "방에서 나갔고, 인원이 없어 삭제되었습니다."));
        }
        return ResponseEntity.ok(Map.of("message", "방에서 성공적으로 나갔습니다."));
    }

    @PostMapping("/rooms/{roomId}/start")
    public ResponseEntity<?> startGame(@PathVariable Long roomId, @CurrentUser String nickname) {
        roomService.startGame(roomId, nickname);
        return ResponseEntity.ok(Map.of("message", "게임이 시작되었습니다."));
    }
}
