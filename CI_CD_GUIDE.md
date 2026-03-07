# CI/CD Guide

This guide explains how code gets from your machine to production. It covers both the CI (build + test) and Deploy (ship to AWS) workflows.

## Pipeline Overview

```
Push to main ──► CI Workflow ──► Deploy Workflow ──► Verify
                 (build/test)    (build images,      (wait for
                                  push to ECR/S3,     services to
                                  update ECS)         stabilize)
```

The pipeline is two GitHub Actions workflows that run in sequence:

1. **CI** (`ci.yml`) — Builds and tests every service on every push/PR
2. **Deploy** (`deploy.yml`) — Triggers after CI passes on `main`, deploys only changed services

## CI Workflow

**File**: `.github/workflows/ci.yml`
**Triggers**: Push to `main`, pull requests targeting `main`

Five jobs run **in parallel**:

| Job | What it does |
|-----|-------------|
| User Service | Java 21 build + `mvnw test` |
| Plan Catalog Service | Java 21 build + `mvnw test` |
| Order Service | Java 21 build + `mvnw test` |
| Frontend | Node 22, `npm ci`, `npm run build`, `npm test` |
| Terraform | `terraform init`, `fmt -check`, `validate` |

If any job fails, the PR is blocked from merging (when branch protection is enabled).

## Deploy Workflow

**File**: `.github/workflows/deploy.yml`
**Triggers**: Automatically after CI completes successfully on `main`

### Job 1: Detect Changes

Uses [dorny/paths-filter](https://github.com/dorny/paths-filter) to check which directories changed:

```
services/user-service/**          → user-service
services/plan-catalog-service/**  → plan-catalog-service
services/order-service/**         → order-service
frontend/**                       → frontend
```

Builds a **dynamic matrix** so only changed services get built and deployed. If you only changed the frontend, backend jobs are skipped entirely.

### Job 2: Build Backend

For each changed backend service:

1. Authenticates to AWS using OIDC (no stored secrets)
2. Logs into Amazon ECR (container registry)
3. Builds the Docker image with BuildKit caching
4. Pushes two tags: `latest` and the git SHA (`abc1234`)

### Job 3: Build & Deploy Frontend

When frontend files change:

1. Installs Node.js 22, runs `npm ci` and `npm run build`
2. Authenticates to AWS using OIDC
3. Syncs hashed assets (`/assets/*`) to S3 with **immutable caching** (1 year)
4. Syncs remaining files (`index.html`, etc.) with **no-cache** headers
5. Invalidates the CloudFront CDN cache so users get the new version

### Job 4: Deploy Backend

For each changed backend service:

1. Authenticates to AWS using OIDC
2. Runs `aws ecs update-service --force-new-deployment`
3. ECS pulls the new `latest` image and performs a rolling update

### Job 5: Verify

1. Waits for all deployed ECS services to stabilize (`aws ecs wait services-stable`)
2. Writes a deployment summary to the GitHub Actions run page

## ECS/Fargate Explained

**ECS (Elastic Container Service)** runs your Docker containers on AWS without managing servers.

Key concepts:

| Concept | What it is |
|---------|-----------|
| **Cluster** | A logical grouping of services. Ours: `consumer-ordering-dev-cluster` |
| **Service** | Keeps N copies of a task running. One per microservice (e.g., `consumer-ordering-dev-user-service`) |
| **Task Definition** | A blueprint: which Docker image, how much CPU/memory, which env vars, which ports |
| **Task** | A running instance of a task definition (like a container) |
| **Fargate** | Serverless compute — AWS manages the underlying EC2 instances for you |

**How `force-new-deployment` works:**
1. ECS sees the service needs a new deployment
2. It launches new tasks using the latest image from ECR
3. The ALB health checks pass on the new tasks
4. Old tasks are drained and stopped
5. Zero-downtime rolling update complete

**Check service status:**
```bash
aws ecs describe-services \
  --cluster consumer-ordering-dev-cluster \
  --services consumer-ordering-dev-user-service \
  --query 'services[0].{status:status,running:runningCount,desired:desiredCount,deployments:deployments[*].{status:status,running:runningCount,desired:desiredCount}}'
```

## OIDC Authentication

The deploy workflow uses **OpenID Connect (OIDC)** to authenticate to AWS — no long-lived AWS access keys stored as GitHub secrets.

How it works:

1. GitHub Actions requests a short-lived JWT token from GitHub's OIDC provider
2. The workflow presents this token to AWS STS via `AssumeRoleWithWebIdentity`
3. AWS checks the trust policy on the IAM role:
   - Is the token from `token.actions.githubusercontent.com`?
   - Is the `aud` claim `sts.amazonaws.com`?
   - Is the `sub` claim from `repo:roh-y/consumer-ordering:ref:refs/heads/main`?
4. If all checks pass, AWS returns temporary credentials (valid ~1 hour)
5. The workflow uses these credentials for ECR, ECS, S3, and CloudFront operations

**Terraform resources** (in `infrastructure/modules/iam/github-oidc.tf`):
- `aws_iam_openid_connect_provider.github_actions` — registers GitHub as an identity provider
- `aws_iam_role.github_actions` — the role with a trust policy scoped to your repo + branch
- `aws_iam_role_policy.github_actions_deploy` — permissions for ECR push, ECS deploy, S3 sync, CloudFront invalidation

## GitHub Secrets Setup

After running `terraform apply`, you need to set 4 GitHub repository secrets. The deploy workflow reads these at runtime.

### Step 1: Get the values from Terraform

```bash
cd infrastructure/environments/dev

terraform output aws_account_id
terraform output s3_frontend_bucket
terraform output cloudfront_distribution_id
terraform output api_gateway_endpoint
```

### Step 2: Set the secrets in GitHub

Go to **Settings → Secrets and variables → Actions → New repository secret** and add:

| Secret Name | Value Source | Example |
|-------------|-------------|---------|
| `AWS_ACCOUNT_ID` | `terraform output aws_account_id` | `123456789012` |
| `S3_FRONTEND_BUCKET` | `terraform output s3_frontend_bucket` | `consumer-ordering-dev-frontend-abc123` |
| `CLOUDFRONT_DISTRIBUTION_ID` | `terraform output cloudfront_distribution_id` | `E1ABC2DEF3GHIJ` |
| `API_GATEWAY_ENDPOINT` | `terraform output api_gateway_endpoint` | `https://abc123.execute-api.us-east-1.amazonaws.com/dev` |

> **Note:** No `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` needed — OIDC handles authentication.

## Manual Deployment

For deploying from your local machine (useful during development):

```bash
# 1. Login to ECR (required once per session)
make deploy-login

# 2. Deploy a single service
make deploy-service SERVICE=user-service

# 3. Deploy all backend services
make deploy-backend

# 4. Build and deploy frontend to S3/CloudFront
make deploy-frontend

# 5. Deploy everything (backend + frontend)
make deploy-all
```

Each `deploy-service` call builds the Docker image, pushes to ECR, triggers an ECS deployment, and waits for the service to stabilize.

## Testing the Pipeline

### Trigger a deploy

1. Push a commit to `main` (or merge a PR)
2. Go to **Actions** tab in GitHub
3. Watch the **CI** workflow complete
4. The **Deploy** workflow starts automatically

### What to expect

- **detect-changes** runs first (~10s) — determines which services changed
- **build-backend** and **build-frontend** run in parallel (~2-4 min each)
- **deploy-backend** runs after build completes (~1-2 min)
- **verify** waits for ECS stabilization (~2-5 min)
- Total: ~5-10 minutes for a full deploy

### Where to watch

1. **GitHub Actions** → the workflow run shows all jobs and their logs
2. **AWS Console → ECS** → your cluster shows deployment status
3. **AWS Console → CloudFront** → check invalidation status

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Deploy workflow doesn't trigger | CI failed or didn't run on `main` | Check CI workflow; deploy only triggers on successful CI runs on `main` |
| `Error: Not authorized to perform sts:AssumeRoleWithWebIdentity` | OIDC trust policy mismatch | Check `github_repository` variable in Terraform matches your repo. Ensure you're pushing from `main` |
| `Error: Cannot perform ECR login` | `AWS_ACCOUNT_ID` secret is wrong or missing | Verify the secret in GitHub Settings matches your AWS account ID |
| ECR push fails with 403 | IAM role missing ECR permissions | Run `terraform apply` to ensure IAM policy is up to date |
| ECS deploy timeout (services-stable) | New container is failing health checks | Check ECS task logs in CloudWatch. Common: wrong env vars, port mismatch, app crash on startup |
| S3 sync permission denied | IAM role missing S3 permissions or wrong bucket name | Verify `S3_FRONTEND_BUCKET` secret. Re-run `terraform apply` if bucket was recently created |
| CloudFront invalidation fails | Wrong distribution ID or missing permissions | Verify `CLOUDFRONT_DISTRIBUTION_ID` secret matches `terraform output` |
| Build succeeds but old version still shows | Browser caching old `index.html` | Hard refresh (Ctrl+Shift+R). CloudFront invalidation can take 1-2 minutes |
| `No changes detected` — nothing deploys | Files changed aren't in a watched path | Check the paths-filter config in `deploy.yml` — only `services/*` and `frontend/*` are watched |

## How GitHub Actions Works (Reference)

**Triggers**: Events that start a workflow
```yaml
on:
  push:            # Code pushed to a branch
    branches: [main]
  pull_request:    # PR opened/updated
    branches: [main]
  workflow_run:    # Another workflow completed
    workflows: ["CI"]
    types: [completed]
```

**Jobs**: Independent units of work. Each job gets a fresh virtual machine.

**Steps**: Commands within a job, executed sequentially.

**Concurrency**: The deploy workflow uses `concurrency` to prevent overlapping deployments:
```yaml
concurrency:
  group: deploy-${{ github.ref }}
  cancel-in-progress: false  # Don't cancel running deploys
```

## How to Read Build Logs

1. Go to your GitHub repo → **Actions** tab
2. Click on the workflow run
3. Click on a failed job to see its logs
4. Expand the failed step to see the error
