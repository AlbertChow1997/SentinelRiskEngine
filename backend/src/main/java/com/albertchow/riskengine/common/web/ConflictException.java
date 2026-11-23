package com.albertchow.riskengine.common.web;

/** Maps to 409 Problem Details, e.g. IDEMPOTENCY_CONFLICT or INVALID_STATUS_TRANSITION. */
public class ConflictException extends RuntimeException {
  private final String code;

  public ConflictException(String code, String detail) {
    super(detail);
    this.code = code;
  }

  public String code() {
    return code;
  }
}
