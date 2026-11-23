package com.albertchow.riskengine.common.time;

import java.time.Clock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** One UTC clock for the whole service, so tests can replace it with a fixed one. */
@Configuration(proxyBeanMethods = false)
public class ClockConfiguration {
  @Bean
  Clock clock() {
    return Clock.systemUTC();
  }
}
