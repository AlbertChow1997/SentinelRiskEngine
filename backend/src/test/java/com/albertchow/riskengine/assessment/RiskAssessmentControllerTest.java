package com.albertchow.riskengine.assessment;

import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.albertchow.riskengine.contract.OpenApiContract;
import com.jayway.jsonpath.JsonPath;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

@WebMvcTest(RiskAssessmentController.class)
@Import({StubRiskAssessmentService.class, RiskAssessmentControllerTest.FixedClock.class})
class RiskAssessmentControllerTest {
  private static final String VALID =
      """
      {"transactionId":"tx-001","customerId":"cust-001","merchantId":"merch-001",
       "amount":49.99,"currency":"EUR","countryCode":"IE","transactionTime":"2026-11-18T09:59:00Z"}
      """;

  @Autowired private MockMvc mvc;

  @TestConfiguration
  static class FixedClock {
    @Bean
    @Primary
    Clock fixedClock() {
      return Clock.fixed(Instant.parse("2026-11-23T10:00:00Z"), ZoneOffset.UTC);
    }
  }

  private ResultActions postBody(String body) throws Exception {
    return mvc.perform(
        post("/api/v1/risk-assessments")
            .contentType(MediaType.APPLICATION_JSON)
            .header("X-Request-Id", "test-req-1")
            .content(body));
  }

  @Test
  void validRequestReturnsAContractShapedAssessment() throws Exception {
    String body =
        postBody(VALID)
            .andExpect(status().isOk())
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
            .andExpect(header().string("X-Request-Id", "test-req-1"))
            .andExpect(jsonPath("$.transactionId").value("tx-001"))
            .andExpect(jsonPath("$.amount").value(49.99))
            .andExpect(jsonPath("$.decision").value("APPROVE"))
            .andExpect(jsonPath("$.status").value("AUTO_DECIDED"))
            .andExpect(jsonPath("$.degraded").value(true))
            .andExpect(jsonPath("$.reasons[0]").value("ML_UNAVAILABLE"))
            .andExpect(jsonPath("$.transactionTime").value("2026-11-18T09:59:00Z"))
            .andExpect(jsonPath("$.assessedAt").value("2026-11-23T10:00:00Z"))
            .andReturn()
            .getResponse()
            .getContentAsString();
    OpenApiContract.assertMatches("RiskAssessment", body);
  }

  @Test
  void sameTransactionIdReturnsTheSameAssessmentId() throws Exception {
    String first =
        JsonPath.read(
            postBody(VALID).andReturn().getResponse().getContentAsString(), "$.assessmentId");
    postBody(VALID).andExpect(jsonPath("$.assessmentId").value(first));
    postBody(VALID.replace("tx-001", "tx-other"))
        .andExpect(jsonPath("$.assessmentId").value(not(first)));
  }

  @Test
  void invalidFieldsReturnAValidationProblem() throws Exception {
    String body =
        postBody(
                """
                {"transactionId":"tx-002","merchantId":"merch-001","amount":0,
                 "currency":"eur","countryCode":"IE","transactionTime":"2999-01-01T00:00:00Z"}
                """)
            .andExpect(status().isBadRequest())
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
            .andExpect(jsonPath("$.status").value(400))
            .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
            .andExpect(jsonPath("$.errors.customerId").exists())
            .andExpect(jsonPath("$.errors.amount").exists())
            .andExpect(jsonPath("$.errors.currency").exists())
            .andExpect(jsonPath("$.errors.transactionTime").exists())
            .andExpect(jsonPath("$.errors.countryCode").doesNotExist())
            .andReturn()
            .getResponse()
            .getContentAsString();
    OpenApiContract.assertMatches("ValidationProblem", body);
  }

  @Test
  void amountWithMoreThanTwoDecimalsIsRejected() throws Exception {
    postBody(VALID.replace("49.99", "49.999"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors.amount").exists());
  }

  @Test
  void malformedJsonReturnsAProblemWithoutParserDetails() throws Exception {
    String body =
        postBody("{\"transactionId\": ")
            .andExpect(status().isBadRequest())
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
            .andExpect(jsonPath("$.code").value("MALFORMED_REQUEST"))
            .andExpect(
                jsonPath("$.detail")
                    .value("The request body is not valid JSON or a field has the wrong type."))
            .andReturn()
            .getResponse()
            .getContentAsString();
    OpenApiContract.assertMatches("ProblemDetail", body);
  }
}
