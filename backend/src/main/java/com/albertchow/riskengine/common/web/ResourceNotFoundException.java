package com.albertchow.riskengine.common.web;

/** Maps to 404 Problem Details. Also used for cross-tenant reads, which must not reveal data. */
public class ResourceNotFoundException extends RuntimeException {
  private final String code;

  public ResourceNotFoundException(String code, String detail) {
    super(detail);
    this.code = code;
  }

  public String code() {
    return code;
  }
}
