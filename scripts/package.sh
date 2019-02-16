#!/bin/bash

sam package \
  --output-template-file .aws-sam/build/packed.yml \
  --s3-bucket codepipeline-multi-manual-approvals
