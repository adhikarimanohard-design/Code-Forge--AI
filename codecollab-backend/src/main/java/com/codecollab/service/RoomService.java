package com.codecollab.service;

import com.codecollab.model.Room;
import com.codecollab.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomRepository roomRepository;

    public Room getOrCreateRoom(String roomId) {
        return roomRepository.findById(roomId).orElseGet(() -> {
            Room room = new Room();
            room.setRoomId(roomId);
            room.setLanguage("javascript");
            room.setCurrentCode("// Start coding...");
            room.setParticipants(new ArrayList<>());
            room.setLastUpdated(LocalDateTime.now());
            return roomRepository.save(room);
        });
    }

    public void updateCode(String roomId, String code) {
        roomRepository.findById(roomId).ifPresent(room -> {
            room.setCurrentCode(code);
            room.setLastUpdated(LocalDateTime.now());
            roomRepository.save(room);
        });
    }

    public void addParticipant(String roomId, String userId) {
        roomRepository.findById(roomId).ifPresent(room -> {
            if (!room.getParticipants().contains(userId)) {
                room.getParticipants().add(userId);
                roomRepository.save(room);
            }
        });
    }

    public void removeParticipant(String roomId, String userId) {
        roomRepository.findById(roomId).ifPresent(room -> {
            room.getParticipants().remove(userId);
            roomRepository.save(room);
        });
    }
}