package com.albertchow.riskengine.common.web;

import java.util.Map;
import java.util.TreeMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

/**
 * RFC 9457 Problem Details for every error. Business errors carry a machine-readable {@code code};
 * validation errors add an {@code errors} map of field to message. Rejected values and exception
 * internals are never echoed back.
 */
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {
  private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

  @Override
  protected ResponseEntity<Object> handleMethodArgumentNotValid(
      MethodArgumentNotValidException ex,
      HttpHeaders headers,
      HttpStatusCode status,
      WebRequest request) {
    Map<String, String> errors = new TreeMap<>();
    ex.getBindingResult()
        .getFieldErrors()
        .forEach(
            error ->
                errors.merge(
                    error.getField(),
                    error.getDefaultMessage() == null ? "is invalid" : error.getDefaultMessage(),
                    (first, second) -> first + "; " + second));
    ProblemDetail problem =
        problem(
            HttpStatus.BAD_REQUEST,
            "Validation failed",
            "One or more fields are invalid.",
            "VALIDATION_FAILED");
    problem.setProperty("errors", errors);
    return handleExceptionInternal(ex, problem, headers, status, request);
  }

  @Override
  protected ResponseEntity<Object> handleHttpMessageNotReadable(
      HttpMessageNotReadableException ex,
      HttpHeaders headers,
      HttpStatusCode status,
      WebRequest request) {
    ProblemDetail problem =
        problem(
            HttpStatus.BAD_REQUEST,
            "Malformed request body",
            "The request body is not valid JSON or a field has the wrong type.",
            "MALFORMED_REQUEST");
    return handleExceptionInternal(ex, problem, headers, status, request);
  }

  @ExceptionHandler(ResourceNotFoundException.class)
  ProblemDetail handleNotFound(ResourceNotFoundException ex) {
    return problem(HttpStatus.NOT_FOUND, "Not found", ex.getMessage(), ex.code());
  }

  @ExceptionHandler(ConflictException.class)
  ProblemDetail handleConflict(ConflictException ex) {
    return problem(HttpStatus.CONFLICT, "Conflict", ex.getMessage(), ex.code());
  }

  @ExceptionHandler(Exception.class)
  ProblemDetail handleUnexpected(Exception ex) {
    log.error("Unhandled exception", ex);
    return problem(
        HttpStatus.INTERNAL_SERVER_ERROR,
        "Internal error",
        "An unexpected error occurred. Quote the X-Request-Id header when reporting it.",
        "INTERNAL_ERROR");
  }

  private static ProblemDetail problem(
      HttpStatus status, String title, String detail, String code) {
    ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, detail);
    problem.setTitle(title);
    problem.setProperty("code", code);
    return problem;
  }
}
