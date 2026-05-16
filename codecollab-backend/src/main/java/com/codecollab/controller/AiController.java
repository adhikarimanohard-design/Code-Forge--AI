package com.codecollab.controller;

import com.codecollab.service.AiService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    @PostMapping("/explain")
    public String explain(@RequestBody Map<String, String> body) {
        return aiService.explain(body.get("code"));
    }

    @PostMapping("/debug")
    public String debug(@RequestBody Map<String, String> body) {
        return aiService.debug(body.get("code"));
    }
}