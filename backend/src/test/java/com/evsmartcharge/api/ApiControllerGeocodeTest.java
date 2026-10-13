package com.evsmartcharge.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

class ApiControllerGeocodeTest {
    @Test
    void geocodesPlacesWithPhoton() {
        RestClient.Builder restClientBuilder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(restClientBuilder).build();
        ApiController controller = new ApiController(new ObjectMapper(), restClientBuilder);
        server.expect(requestTo("https://photon.komoot.io/api/?limit=5&q=Pune"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess("""
                        {"features":[{"geometry":{"coordinates":[73.8545,18.5214]},
                        "properties":{"name":"Pune","state":"Maharashtra","country":"India"}}]}
                        """, MediaType.APPLICATION_JSON));

        Map<String, Object> response = controller.geocode("Pune");

        assertThat(response.get("success")).isEqualTo(true);
        assertThat(new ObjectMapper().convertValue(
                        response.get("results"), new TypeReference<List<Map<String, Object>>>() {}))
                .containsExactly(Map.of(
                        "latitude", 18.5214,
                        "longitude", 73.8545,
                        "name", "Pune",
                        "displayName", "Pune, Maharashtra, India"));
        server.verify();
    }

    @Test
    void fallsBackToNominatimWhenPhotonIsUnavailable() {
        RestClient.Builder restClientBuilder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(restClientBuilder).build();
        ApiController controller = new ApiController(new ObjectMapper(), restClientBuilder);
        server.expect(requestTo("https://photon.komoot.io/api/?limit=5&q=Pune"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(request -> {
                    throw new java.io.IOException("Photon unavailable");
                });
        server.expect(requestTo("https://nominatim.openstreetmap.org/search?format=json&limit=5&addressdetails=1&q=Pune"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess("""
                        [{"lat":"18.5214","lon":"73.8545","name":"Pune",
                        "display_name":"Pune, Maharashtra, India"}]
                        """, MediaType.APPLICATION_JSON));

        Map<String, Object> response = controller.geocode("Pune");

        assertThat(response.get("success")).isEqualTo(true);
        assertThat(new ObjectMapper().convertValue(
                        response.get("results"), new TypeReference<List<Map<String, Object>>>() {}))
                .containsExactly(Map.of(
                        "latitude", 18.5214,
                        "longitude", 73.8545,
                        "name", "Pune",
                        "displayName", "Pune, Maharashtra, India"));
        server.verify();
    }
}
