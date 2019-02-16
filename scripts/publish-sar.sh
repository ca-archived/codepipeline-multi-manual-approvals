#!/bin/bash

sam publish -t .aws-sam/build/packed.yml --region ap-northeast-1

sam publish -t .aws-sam/build/packed.yml --region us-east-1
