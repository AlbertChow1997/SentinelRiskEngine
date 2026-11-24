#!/usr/bin/env bash
set -euo pipefail
# Invoked only by deploy-staging.yml after preflight and the real environment gate.
[[ ${GITHUB_ACTIONS:-} == true && ${GITHUB_REF:-} == refs/heads/main ]] || { echo 'Use the approved main-branch staging workflow.' >&2; exit 1; }
: "${STAGING_ECR_REGISTRY:?}" "${STAGING_WEBSITE_BUCKET:?}" "${STAGING_DISTRIBUTION_ID:?}" "${STAGING_URL:?}" "${INFRA_OWNER:?}" "${GITHUB_SHA:?}"
export AWS_REGION=${AWS_REGION:-eu-north-1} AWS_PAGER=""  # ADR-0015
work=$(mktemp -d)
trap 'rm -rf -- "$work"' EXIT
gzip -dc .staging-artifact/images.tar.gz | docker load >/dev/null
aws ecr get-login-password | docker login --username AWS --password-stdin "$STAGING_ECR_REGISTRY" >/dev/null
declare -A images
for component in risk-engine nginx; do
  repository="sentinel-staging/$component"
  tag="$STAGING_ECR_REGISTRY/$repository:$GITHUB_SHA"
  if aws ecr describe-images --repository-name "$repository" --image-ids "imageTag=$GITHUB_SHA" > "$work/existing.json" 2> "$work/ecr-error.log"; then
    # Immutable tag from a previous attempt: pull and scan the actual reused image.
    docker pull "$tag" >/dev/null
    docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy:0.76.2 image --scanners vuln --ignore-unfixed --exit-code 1 --severity HIGH,CRITICAL "$tag"
  else
    grep -q ImageNotFoundException "$work/ecr-error.log" || { echo 'ECR lookup failed; refusing to treat an IAM/network error as a new tag.' >&2; exit 1; }
    docker tag "sentinel-$component:staging" "$tag"
    docker push "$tag" > "$work/push.log"
  fi
  digest=$(aws ecr describe-images --repository-name "$repository" --image-ids "imageTag=$GITHUB_SHA" --query 'imageDetails[0].imageDigest' --output text)
  [[ "$digest" == sha256:* ]] || { echo 'No published image digest.' >&2; exit 1; }
  images[$component]="$STAGING_ECR_REGISTRY/$repository@$digest"
done
# Explicit dispatch confirmation + non-self environment approval authorise this start.
printf 'start\n' | bash infra/scripts/aws-wake.sh --agent-only
for component in risk-engine nginx; do
  service="sentinel-staging-$component"
  aws ecs describe-task-definition --task-definition "$service" > "$work/task.json"
  # Terraform creates each service with an ':unpublished' placeholder image. If the first real
  # deployment fails, the circuit breaker "rolls back" to that placeholder and ECS retries the
  # impossible pull forever, so such a service is scaled back to zero on failure.
  never_published=$(python3 -c 'import json,sys; t=json.load(open(sys.argv[1]))["taskDefinition"]; print(str(any(c["image"].endswith(":unpublished") for c in t["containerDefinitions"])).lower())' "$work/task.json")
  python3 infra/scripts/render_task_definition.py "$work/task.json" "$service" "${images[$component]}" > "$work/register.json"
  revision=$(aws ecs register-task-definition --cli-input-json "file://$work/register.json" --tags key=project,value=sentinel-pay key=env,value=staging "key=owner,value=$INFRA_OWNER" --query 'taskDefinition.taskDefinitionArn' --output text)
  aws ecs update-service --cluster sentinel-staging --service "$service" --task-definition "$revision" --desired-count 1 > "$work/service.json"
  # The waiter gives up after ten minutes, e.g. while a rollback to the placeholder retries;
  # the rollout check below decides success or failure either way.
  aws ecs wait services-stable --cluster sentinel-staging --services "$service" || echo "services-stable did not succeed for $service; checking the rollout state." >&2
  # services-stable can return before ECS marks the rollout COMPLETED: with the circuit breaker
  # it settles some seconds later (25 s in run 45198803686). Wait for a final rollout state.
  for ((poll = 1; poll <= ${ROLLOUT_MAX_POLLS:-60}; poll++)); do
    deployed=$(aws ecs describe-services --cluster sentinel-staging --services "$service" --query 'services[0].deployments[?status==`PRIMARY`].[taskDefinition,rolloutState] | [0]' --output text)
    read -r actual rollout <<< "$deployed"
    [[ "$rollout" == IN_PROGRESS ]] || break
    sleep "${ROLLOUT_POLL_SECONDS:-10}"
  done
  if [[ "$actual" != "$revision" || "$rollout" != COMPLETED ]]; then
    echo "ECS rollout ended as $rollout on $actual, not COMPLETED on the new revision; refusing a false success after rollback." >&2
    if [[ "$never_published" == true ]]; then
      aws ecs update-service --cluster sentinel-staging --service "$service" --desired-count 0 > "$work/service.json"
      echo "$service had never run a published image; scaled it to 0 so ECS stops retrying the placeholder." >&2
    fi
    exit 1
  fi
done
# Hashed assets remain available for older open pages/rollback. Index is published last.
aws s3 sync .staging-artifact/frontend/ "s3://$STAGING_WEBSITE_BUCKET/" --exclude index.html --cache-control 'public,max-age=300' --only-show-errors
aws s3 cp .staging-artifact/frontend/index.html "s3://$STAGING_WEBSITE_BUCKET/index.html" --cache-control 'no-cache,no-store,must-revalidate' --only-show-errors
invalidation=$(aws cloudfront create-invalidation --distribution-id "$STAGING_DISTRIBUTION_ID" --paths '/*' --query 'Invalidation.Id' --output text)
aws cloudfront wait invalidation-completed --distribution-id "$STAGING_DISTRIBUTION_ID" --id "$invalidation"
python3 infra/scripts/smoke_staging.py "$STAGING_URL"
echo 'Deployment completed; host stays running until the next scheduled stop.'
