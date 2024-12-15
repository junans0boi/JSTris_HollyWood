package com.junzzang.TetrisBackend.service;

import com.junzzang.TetrisBackend.entity.Room;
import com.junzzang.TetrisBackend.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RoomService {
    private final RoomRepository roomRepository;

    public Room createRoom(String title, boolean isPrivate, String password, int maxPlayers, String host) {
        if (!isPrivate) {
            password = null;
        }
        Room room = new Room();
        room.setTitle(title);
        room.setPassword(password);
        room.setMaxPlayers(maxPlayers);
        room.setCurrentPlayers(1);
        room.setHost(host);
        room.setCreatedAt(LocalDateTime.now());
        room.setGameStarted(false);
        room.getJoinedPlayers().add(host);

        return roomRepository.save(room);
    }

    public List<Room> getAllRooms() {
        return roomRepository.findAll();
    }

    public Room findRoom(Long roomId) {
        return roomRepository.findById(roomId).orElseThrow(() -> new RuntimeException("방을 찾을 수 없습니다."));
    }

    public Room joinRoom(Long roomId, String nickname, String password) {
        Room room = findRoom(roomId);
        if (room.isGameStarted()) {
            throw new RuntimeException("이미 게임이 시작된 방입니다.");
        }
        if (room.getPassword() != null && !room.getPassword().equals(password)) {
            throw new RuntimeException("비밀번호가 올바르지 않습니다.");
        }
        if (room.getCurrentPlayers() >= room.getMaxPlayers()) {
            throw new RuntimeException("방이 가득 찼습니다.");
        }
        if (room.getJoinedPlayers().contains(nickname)) {
            throw new RuntimeException("이미 이 방에 참여하고 있습니다.");
        }
        room.getJoinedPlayers().add(nickname);
        room.setCurrentPlayers(room.getCurrentPlayers() + 1);
        return roomRepository.save(room);
    }

    public Room leaveRoom(Long roomId, String nickname) {
        Room room = findRoom(roomId);
        if(!room.getJoinedPlayers().contains(nickname)) {
            throw new RuntimeException("해당 플레이어는 이 방에 있지 않습니다.");
        }

        room.getJoinedPlayers().remove(nickname);
        room.setCurrentPlayers(room.getCurrentPlayers()-1);
        if(room.getCurrentPlayers() == 0) {
            roomRepository.delete(room);
            return null;
        }

        // 방장 이탈 시 새로운 방장 지정
        if(room.getHost().equals(nickname)) {
            if(!room.getJoinedPlayers().isEmpty()) {
                String newHost = room.getJoinedPlayers().get(0);
                room.setHost(newHost);
            }
        }
        return roomRepository.save(room);
    }

    public Room startGame(Long roomId, String nickname) {
        Room room = findRoom(roomId);
        if(!room.getHost().equals(nickname)) {
            throw new RuntimeException("방장만 게임을 시작할 수 있습니다.");
        }
        if(room.isGameStarted()) {
            throw new RuntimeException("이미 게임이 시작되었습니다.");
        }
        room.setGameStarted(true);
        return roomRepository.save(room);
    }
}
