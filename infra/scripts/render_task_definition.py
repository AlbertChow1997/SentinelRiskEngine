"""Keep registrable ECS task fields and replace exactly the intended container."""
import copy
import json
from pathlib import Path
import sys

FIELDS = {"family", "taskRoleArn", "executionRoleArn", "networkMode", "containerDefinitions",
          "volumes", "placementConstraints", "requiresCompatibilities", "cpu", "memory",
          "pidMode", "ipcMode", "proxyConfiguration", "inferenceAccelerators",
          "ephemeralStorage", "runtimePlatform", "enableFaultInjection"}


def render(response, container, image):
    source = response["taskDefinition"]
    result = {key: copy.deepcopy(value) for key, value in source.items() if key in FIELDS}
    matches = [item for item in result["containerDefinitions"] if item["name"] == container]
    if len(matches) != 1:
        raise ValueError("Expected exactly one deployment container")
    if result.get("runtimePlatform", {}).get("cpuArchitecture") != "ARM64":
        raise ValueError("Refusing a non-ARM64 task definition")
    matches[0]["image"] = image
    return result


if __name__ == "__main__":
    print(json.dumps(render(json.loads(Path(sys.argv[1]).read_text()), sys.argv[2], sys.argv[3])))
