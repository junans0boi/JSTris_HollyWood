package com.junzzang.TetrisBackend.repository;

import com.junzzang.TetrisBackend.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoomRepository extends JpaRepository<Room, Long> {
   // host로 검색하거나, title로 검색 등의 쿼리 필요시 추가
}
