package com.codecollab.controller;

import com.codecollab.model.Room;
import com.codecollab.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;
    private final SimpMessagingTemplate messagingTemplate;

    // REST — get room state on join
    @GetMapping("/api/room/{roomId}")
    public Room getRoom(@PathVariable String roomId) {
        return roomService.getOrCreateRoom(roomId);
    }

    // WebSocket — code sync
    @MessageMapping("/room/{roomId}/code")
    public void handleCode(@DestinationVariable String roomId,
                           @Payload Map<String, String> payload) {
        roomService.updateCode(roomId, payload.get("code"));
        messagingTemplate.convertAndSend(
            "/topic/room/" + roomId + "/code", payload);
    }

    // WebSocket — user join
    @MessageMapping("/room/{roomId}/join")
    public void handleJoin(@DestinationVariable String roomId,
                           @Payload Map<String, String> payload) {
        String userId = payload.get("userId");
        roomService.addParticipant(roomId, userId);

        Room room = roomService.getOrCreateRoom(roomId);
        messagingTemplate.convertAndSend(
            "/topic/room/" + roomId + "/users",
            room.getParticipants());
    }
}

@MessageMapping("/room/{roomId}/chat")
    public void handleChat(@DestinationVariable String roomId,
                           @Payload Map<String, String> payload) {
        messagingTemplate.convertAndSend(
            "/topic/room/" + roomId + "/chat", payload);
    }

}