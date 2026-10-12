package com.evsmartcharge;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
class EvSmartChargeApiTest {
    @Autowired
    private MockMvc mockMvc;

    @Test
    void exposesStationCatalogAndChargingCalculation() throws Exception {
        mockMvc.perform(get("/api/stations"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").isNotEmpty());

        mockMvc.perform(get("/api/charging-calculator")
                        .param("battery", "40")
                        .param("targetBattery", "80")
                        .param("batteryCapacity", "50")
                        .param("chargingSpeed", "50")
                        .param("pricePerKwh", "12"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.energyRequired").value(20.0))
                .andExpect(jsonPath("$.estimatedCost").value(266.67));
    }

    @Test
    void registerIssuesJwtAndProtectsUserData() throws Exception {
        String email = "test-" + System.nanoTime() + "@example.com";
        MvcResult registration = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Test Driver","email":"%s","password":"safe-password"}
                                """.formatted(email)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn();
        String token = com.jayway.jsonpath.JsonPath.read(
                registration.getResponse().getContentAsString(), "$.token");

        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.email").value(email));

        mockMvc.perform(post("/api/favorites")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"stationId\":\"1\"}"))
                        .andExpect(status().isCreated())
                .andExpect(jsonPath("$.favorite.stationId").value("1"));

        mockMvc.perform(post("/api/trip-history")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"start\":\"Hyderabad\",\"destination\":\"Bengaluru\",\"distance\":570}"))
                        .andExpect(status().isCreated())
                        .andExpect(jsonPath("$.trip.distanceKm").value(570.0));

        mockMvc.perform(get("/api/trip-history").header("Authorization", "Bearer " + token))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$.trips[0].destination").value("Bengaluru"));

        mockMvc.perform(post("/api/chat")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"question\":\"Which CCS2 stations are nearby?\"}"))
                        .andExpect(status().isServiceUnavailable())
                        .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void rejectsUnauthenticatedPrivateDataAndInvalidCalculatorInput() throws Exception {
        mockMvc.perform(get("/api/favorites"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/charging-calculator")
                        .param("battery", "80")
                        .param("targetBattery", "40")
                        .param("batteryCapacity", "50")
                        .param("chargingSpeed", "50")
                        .param("pricePerKwh", "12"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }
}
