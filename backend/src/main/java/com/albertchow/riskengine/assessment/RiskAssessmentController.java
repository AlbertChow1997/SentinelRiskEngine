package com.albertchow.riskengine.assessment;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/risk-assessments")
class RiskAssessmentController {
  private final StubRiskAssessmentService service;

  RiskAssessmentController(StubRiskAssessmentService service) {
    this.service = service;
  }

  @PostMapping
  RiskAssessmentResponse create(@Valid @RequestBody RiskAssessmentRequest request) {
    return service.assess(request);
  }
}
