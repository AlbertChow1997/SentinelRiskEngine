package com.albertchow.riskengine.contract;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/** Proves the contract check can fail, so a passing endpoint test means something. */
class OpenApiContractTest {
  @BeforeEach
  void contractIsReadable() {
    assumeTrue(
        Files.isRegularFile(Path.of("..", "contracts", "openapi-risk-engine-v1.yaml"))
            || System.getenv("CI") != null);
  }

  @Test
  void rejectsAProblemWithTheWrongTypes() {
    assertThat(
            OpenApiContract.violations("ValidationProblem", "{\"status\":\"400\",\"errors\":[]}"))
        .hasSize(2);
  }

  @Test
  void rejectsAnAssessmentMissingRequiredFieldsOrWithABadUuid() {
    assertThat(
            OpenApiContract.violations(
                "RiskAssessment", "{\"assessmentId\":\"not-a-uuid\",\"riskScore\":101}"))
        .anyMatch(message -> message.contains("assessmentId"))
        .anyMatch(message -> message.contains("riskScore"))
        .anyMatch(message -> message.contains("decision"));
  }
}
