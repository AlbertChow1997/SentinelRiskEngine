package com.albertchow.riskengine.assessment;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;

/** Body of {@code POST /api/v1/risk-assessments}; constraints mirror the contract schema. */
public record RiskAssessmentRequest(
    @NotBlank @Size(max = 64) String transactionId,
    @NotBlank @Size(max = 64) String customerId,
    @NotBlank @Size(max = 64) String merchantId,
    @NotNull @DecimalMin(value = "0", inclusive = false) @Digits(integer = 12, fraction = 2)
        BigDecimal amount,
    @NotNull @Pattern(regexp = "^[A-Z]{3}$", message = "must be an ISO 4217 code such as EUR")
        String currency,
    @NotNull
        @Pattern(regexp = "^[A-Z]{2}$", message = "must be an ISO 3166-1 alpha-2 code such as IE")
        String countryCode,
    @NotNull @PastOrPresent Instant transactionTime) {}
