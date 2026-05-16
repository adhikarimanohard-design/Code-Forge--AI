package com.codecollab.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Document(collection = "rooms")
public class Room {
    @Id
    private String roomId;
    private String language;
    private String currentCode;
    private List<String> participants;
    private LocalDateTime lastUpdated;
}