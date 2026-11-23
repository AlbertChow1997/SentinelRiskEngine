package com.albertchow.riskengine.assessment;

import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

/**
 * Contract-shaped stub (RISK-116) so consumers can integrate before the rules (RISK-14), the ML
 * client (RISK-16) and persistence (RISK-13/17) exist. No rules or model run, so every request is
 * approved on a zero score and marked degraded with {@code ML_UNAVAILABLE}. Nothing is stored.
 */
@Service
public class StubRiskAssessmentService {
  private final Clock clock;

  public StubRiskAssessmentService(Clock clock) {
    this.clock = clock;
  }

  public RiskAssessmentResponse assess(RiskAssessmentRequest request) {
    return new RiskAssessmentResponse(
        // Same transactionId, same assessmentId: matches the contract's idempotency semantics.
        UUID.nameUUIDFromBytes(
            ("risk-assessment:" + request.transactionId()).getBytes(StandardCharsets.UTF_8)),
        request.transactionId(),
        request.customerId(),
        request.merchantId(),
        request.amount(),
        request.currency(),
        request.countryCode(),
        request.transactionTime(),
        RiskDecision.APPROVE,
        RiskDecision.APPROVE,
        AssessmentStatus.AUTO_DECIDED,
        0,
        0,
        null,
        null,
        true,
        List.of("ML_UNAVAILABLE"),
        List.of(),
        List.of(),
        null,
        Instant.now(clock).truncatedTo(ChronoUnit.MILLIS),
        null,
        false);
  }
}
