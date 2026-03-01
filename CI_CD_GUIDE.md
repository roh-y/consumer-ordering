# CI/CD Guide

## What is CI/CD?

**Continuous Integration (CI)**: Every time you push code, automated tests run to catch bugs before they reach production.

**Continuous Deployment (CD)**: After tests pass, code is automatically deployed to your environment.

Think of it as a safety net: you push code, and the system automatically builds it, tests it, and deploys it — no manual steps.

## Our CI Pipeline (GitHub Actions)

The file `.github/workflows/ci.yml` defines our CI pipeline. Here's what happens on every pull request:

### Job 1: User Service
1. Checks out the code
2. Sets up Java 21
3. Builds the service (`mvnw package`)
4. Runs tests (`mvnw test`)

### Job 2: Frontend
1. Checks out the code
2. Sets up Node.js 22
3. Installs dependencies (`npm ci`)
4. Builds the app (`npm run build`)
5. Runs tests (`npm test`)

### Job 3: Terraform
1. Checks out the code
2. Sets up Terraform
3. Checks formatting (`terraform fmt -check`)
4. Validates configuration (`terraform validate`)

All three jobs run **in parallel** for faster feedback.

## How GitHub Actions Works

**Triggers**: Events that start the pipeline
```yaml
on:
  pull_request:    # Runs when a PR is opened/updated
    branches: [main]
  push:            # Runs when code is pushed to main
    branches: [main]
```

**Jobs**: Independent units of work. Each job gets a fresh virtual machine.

**Steps**: Commands within a job, executed sequentially.

## How to Read Build Logs

1. Go to your GitHub repo → **Actions** tab
2. Click on the workflow run
3. Click on a failed job to see its logs
4. Expand the failed step to see the error

Common failures:
- **Test failure**: A test assertion failed → read the test output, fix the code
- **Build failure**: Compilation error → check the error message, fix the syntax
- **Terraform format**: Files aren't formatted → run `terraform fmt -recursive`

## Future: AWS CodePipeline (Phase 5)

For production deployments, we'll add:

```
GitHub Push → GitHub Actions (lint/test) → AWS CodePipeline
  → CodeBuild (build Docker image) → ECR (store image)
  → CodeDeploy → ECS (blue/green deployment)
```

**Blue/green deployment**: Two identical environments (blue = current, green = new). Traffic is shifted from blue to green. If something goes wrong, instantly shift back to blue. Zero downtime.
