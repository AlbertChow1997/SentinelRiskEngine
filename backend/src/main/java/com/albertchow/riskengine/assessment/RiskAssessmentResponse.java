package com.albertchow.riskengine.assessment;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** The contract's {@code RiskAssessment} schema. Nullable fields are serialised as null. */
public record RiskAssessmentResponse(
    UUID assessmentId,
    String transactionId,
    String customerId,
    String merchantId,
    BigDecimal amount,
    String currency,
    String countryCode,
    Instant transactionTime,
    RiskDecision decision,
    RiskDecision finalDecision,
    AssessmentStatus status,
    int riskScore,
    int ruleScore,
    Integer mlScore,
    String modelVersion,
    boolean degraded,
    List<String> reasons,
    List<RuleHit> ruleHits,
    List<MlFactor> mlFactors,
    Review review,
    Instant assessedAt,
    String paymentStatus,
    boolean fraudConfirmed) {

  public record RuleHit(String code, String description, int scoreImpact, boolean hardDecline) {}

  public record MlFactor(String feature, String description, double contribution) {}

  public record Review(RiskDecision decision, String reviewer, String note, Instant reviewedAt) {}
}
