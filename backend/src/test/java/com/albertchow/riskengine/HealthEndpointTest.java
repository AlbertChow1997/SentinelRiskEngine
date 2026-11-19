package com.albertchow.riskengine;

import static org.assertj.core.api.Assertions.assertThat;

import com.albertchow.riskengine.common.web.RequestIdFilter;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class HealthEndpointTest {
  @LocalServerPort private int port;

  @Test
  void healthIsUpAndEchoesTheRequestId() throws Exception {
    try (HttpClient client = HttpClient.newHttpClient()) {
      var request =
          HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/actuator/health"))
              .header(RequestIdFilter.HEADER, "smoke-123")
              .build();
      var response = client.send(request, HttpResponse.BodyHandlers.ofString());
      assertThat(response.statusCode()).isEqualTo(200);
      assertThat(response.body()).contains("\"status\":\"UP\"").doesNotContain("\"components\"");
      assertThat(response.headers().firstValue(RequestIdFilter.HEADER)).contains("smoke-123");
    }
  }

  @Test
  void sensitiveActuatorEndpointsAreNotExposed() throws Exception {
    try (HttpClient client = HttpClient.newHttpClient()) {
      var request =
          HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/actuator/env")).build();
      var response = client.send(request, HttpResponse.BodyHandlers.ofString());
      assertThat(response.statusCode()).isEqualTo(404);
    }
  }
}
