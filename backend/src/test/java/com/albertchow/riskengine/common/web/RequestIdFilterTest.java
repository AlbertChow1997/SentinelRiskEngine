package com.albertchow.riskengine.common.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import jakarta.servlet.ServletException;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.slf4j.MDC;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class RequestIdFilterTest {
  private final RequestIdFilter filter = new RequestIdFilter();

  @AfterEach
  void clearMdc() {
    MDC.clear();
  }

  @Test
  void propagatesAValidIdToResponseAndLoggingContext() throws Exception {
    var request = new MockHttpServletRequest();
    var response = new MockHttpServletResponse();
    request.addHeader(RequestIdFilter.HEADER, "gateway:payment-123");
    filter.doFilter(
        request,
        response,
        (req, res) -> assertThat(MDC.get("requestId")).isEqualTo("gateway:payment-123"));
    assertThat(response.getHeader(RequestIdFilter.HEADER)).isEqualTo("gateway:payment-123");
    assertThat(MDC.get("requestId")).isNull();
  }

  @ParameterizedTest
  @NullSource
  @ValueSource(
      strings = {
        "",
        "unsafe id",
        "line\r\nbreak",
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abc"
      })
  void replacesMissingOrUnsafeIds(String incoming) throws Exception {
    var request = new MockHttpServletRequest();
    var response = new MockHttpServletResponse();
    if (incoming != null) {
      request.addHeader(RequestIdFilter.HEADER, incoming);
    }
    filter.doFilter(
        request,
        response,
        (req, res) ->
            assertThat(MDC.get("requestId")).isEqualTo(response.getHeader(RequestIdFilter.HEADER)));
    assertThat(UUID.fromString(response.getHeader(RequestIdFilter.HEADER))).isNotNull();
    assertThat(MDC.get("requestId")).isNull();
  }

  @Test
  void restoresThePreviousContextWhenTheRequestFails() {
    MDC.put("requestId", "previous-context");
    assertThatThrownBy(
            () ->
                filter.doFilter(
                    new MockHttpServletRequest(),
                    new MockHttpServletResponse(),
                    (req, res) -> {
                      throw new ServletException("downstream failed");
                    }))
        .isInstanceOf(ServletException.class);
    assertThat(MDC.get("requestId")).isEqualTo("previous-context");
  }
}
