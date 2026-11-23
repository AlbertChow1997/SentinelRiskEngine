package com.albertchow.riskengine.common.web;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.albertchow.riskengine.contract.OpenApiContract;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@WebMvcTest(GlobalExceptionHandlerTest.ThrowingController.class)
@Import(GlobalExceptionHandlerTest.ThrowingController.class)
class GlobalExceptionHandlerTest {
  @Autowired private MockMvc mvc;

  @RestController
  static class ThrowingController {
    @GetMapping("/test/not-found")
    void notFound() {
      throw new ResourceNotFoundException("ASSESSMENT_NOT_FOUND", "Assessment not found.");
    }

    @GetMapping("/test/conflict")
    void conflict() {
      throw new ConflictException("IDEMPOTENCY_CONFLICT", "Same transactionId, different payload.");
    }

    @GetMapping("/test/unexpected")
    void unexpected() {
      throw new IllegalStateException("internal detail that must not leak");
    }
  }

  @Test
  void notFoundMapsTo404WithItsCode() throws Exception {
    String body =
        mvc.perform(get("/test/not-found"))
            .andExpect(status().isNotFound())
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
            .andExpect(jsonPath("$.status").value(404))
            .andExpect(jsonPath("$.code").value("ASSESSMENT_NOT_FOUND"))
            .andReturn()
            .getResponse()
            .getContentAsString();
    OpenApiContract.assertMatches("ProblemDetail", body);
  }

  @Test
  void conflictMapsTo409WithItsCode() throws Exception {
    mvc.perform(get("/test/conflict"))
        .andExpect(status().isConflict())
        .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
        .andExpect(jsonPath("$.code").value("IDEMPOTENCY_CONFLICT"))
        .andExpect(jsonPath("$.title").value("Conflict"));
  }

  @Test
  void unexpectedErrorIs500WithoutInternals() throws Exception {
    mvc.perform(get("/test/unexpected"))
        .andExpect(status().isInternalServerError())
        .andExpect(jsonPath("$.code").value("INTERNAL_ERROR"))
        .andExpect(content().string(not(containsString("must not leak"))));
  }

  @Test
  void unknownPathIsA404Problem() throws Exception {
    mvc.perform(get("/api/v1/does-not-exist"))
        .andExpect(status().isNotFound())
        .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON));
  }
}
