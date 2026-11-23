package com.albertchow.riskengine.contract;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

import com.networknt.schema.Error;
import com.networknt.schema.ExecutionContext;
import com.networknt.schema.Schema;
import com.networknt.schema.SchemaRegistry;
import com.networknt.schema.SpecificationVersion;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.function.Consumer;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.databind.node.ObjectNode;
import tools.jackson.dataformat.yaml.YAMLMapper;

/**
 * Validates JSON against a component schema of {@code contracts/openapi-risk-engine-v1.yaml}.
 * OpenAPI 3.1 schemas are JSON Schema 2020-12, so a schema is checked as {@code $ref} into the
 * contract's own {@code components}.
 */
public final class OpenApiContract {
  private static final Path CONTRACT = Path.of("..", "contracts", "openapi-risk-engine-v1.yaml");
  private static final JsonMapper JSON = JsonMapper.builder().build();
  private static final SchemaRegistry REGISTRY =
      SchemaRegistry.withDefaultDialect(SpecificationVersion.DRAFT_2020_12);
  private static final Consumer<ExecutionContext> ASSERT_FORMATS =
      context -> context.executionConfig(config -> config.formatAssertionsEnabled(true));

  private OpenApiContract() {}

  /**
   * Fails when {@code json} does not match the named schema. The backend image is built with only
   * {@code backend/} as Docker context, so there the check is skipped; in CI ({@code CI} is set) a
   * missing contract fails instead of skipping.
   */
  public static void assertMatches(String schemaName, String json) {
    assumeTrue(
        Files.isRegularFile(CONTRACT) || System.getenv("CI") != null,
        "contracts/ is outside this build context");
    assertThat(violations(schemaName, json)).as("violations of %s", schemaName).isEmpty();
  }

  static List<String> violations(String schemaName, String json) {
    ObjectNode root = JSON.createObjectNode();
    root.put("$schema", "https://json-schema.org/draft/2020-12/schema");
    root.set("components", components());
    root.put("$ref", "#/components/schemas/" + schemaName);
    Schema schema = REGISTRY.getSchema(root);
    return schema.validate(JSON.readTree(json), ASSERT_FORMATS).stream()
        .map(Error::toString)
        .toList();
  }

  private static JsonNode components() {
    try {
      return YAMLMapper.builder()
          .build()
          .readTree(Files.readString(CONTRACT))
          .required("components");
    } catch (java.io.IOException e) {
      throw new IllegalStateException("Cannot read " + CONTRACT.toAbsolutePath(), e);
    }
  }
}
