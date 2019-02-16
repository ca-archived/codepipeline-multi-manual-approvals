BASE := ./scripts

build:          ## Build code and SAM application
	yarn install
	yarn test
	$(BASE)/build.sh

package:        ## Package built SAM application
	$(BASE)/package.sh

deploy:         ## Deploy SAM application
	$(BASE)/deploy.sh

publish:        ## Publish SAM application to AWS Serverless Application Repository
	echo '--- Copy README.md and LICENSE to s3 bucket'
	aws s3 cp LICENSE s3://codepipeline-multi-manual-approvals/metadata/
	aws s3 cp README.md s3://codepipeline-multi-manual-approvals/metadata/

	echo '-- Publish to AWS Serverless Application Repository'
	$(BASE)/publish-sar.sh

clean:          ## Clean built artifacts
	rm -rf .aws-sam

help:           ## Show this help.
	@fgrep -h "##" $(MAKEFILE_LIST) | fgrep -v fgrep | sed -e 's/\\$$//' | sed -e 's/##//'
