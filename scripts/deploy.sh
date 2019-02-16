#!/bin/bash

sam deploy --template-file .aws-sam/build/packed.yml --stack-name codepipeline-multi-approvals --capabilities CAPABILITY_IAM
