package com.codecollab.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class AiService {

    @Value("${groq.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    private static final String GROQ_URL =
        "https://api.groq.com/openai/v1/chat/completions";

    public String explain(String code) {
        return callGroq("Explain this code clearly and concisely:\n\n" + code);
    }

    public String debug(String code) {
        return callGroq("Find bugs and suggest fixes:\n\n" + code);
    }

    private String callGroq(String prompt) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        Map<String, Object> body = Map.of(
            "model", "llama-3.3-70b-versatile",
            "messages", List.of(
                Map.of("role", "user", "content", prompt)
            ),
            "max_tokens", 500
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(
                GROQ_URL, request, Map.class);

            List<Map> choices = (List<Map>) response.getBody().get("choices");
            Map message = (Map) choices.get(0).get("message");
            return (String) message.get("content");

        } catch (Exception e) {
            return "AI error: " + e.getMessage();
        }
    }
}