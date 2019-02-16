'use strict';

const AWS = require('aws-sdk');
const codepipeline = new AWS.CodePipeline();

const putJobFailureResult = (jobId, msg, externalExecutionId) => {
  return codepipeline
    .putJobFailureResult({
      jobId: jobId,
      failureDetails: {
        message: msg,
        type: 'JobFailed',
        externalExecutionId: externalExecutionId
      }
    })
    .promise();
};

const doesDuplicatedApproverExist = approvers => {
  if (!Array.isArray(approvers)) return true;

  if (approvers.length === 0 || approvers.length === 1) return true;

  return approvers.filter(a => approvers.indexOf(a) !== approvers.lastIndexOf(a)).length > 0;
};

exports.handler = async (event, context, callback) => {
  const job = event['CodePipeline.job'];
  const jobId = job.id;

  console.log(`Event: ${JSON.stringify(event)}`);

  if (!!jobId) console.log(`Code pipeline job id is [${jobId}]`);
  else context.fail(`Not found CodePipeline.job.id in event: [${event}]`);

  try {
    const userParams = job.data.actionConfiguration.configuration.UserParameters;
    const params = JSON.parse(userParams);

    if (!params || !params.codepipelinename || !params.approvalstagename) {
      const msg = 'User parameters is missing or in wrong format. ' +
            'Please ensure that User parameters must in following format: ' +
            '{"codepipelinename":"YOUR PIPELINE NAME","approvalstagename":"YOUR MANUAL APPROVAL STAGE NAME"}. ' +
            `User parameters: [${userParams}].`;
      await putJobFailureResult(jobId, msg, context.invokeid);
      context.fail(msg);
    }

    const pipelineName = params.codepipelinename;
    const approvalStateName = params.approvalstagename;

    const statesResult = await codepipeline.getPipelineState({ name: pipelineName }).promise();

    const stageStates = statesResult.stageStates;
    if (!stageStates && stageStates.length === 0) {
      const msg = `No stage stages of pipeline [${pipelineName}]`;
      await putJobFailureResult(jobId, msg, context.invokeid);
      context.fail(msg);
    }

    const approvalState = stageStates.filter(_ => _.stageName === approvalStateName)[0];

    if (!approvalState) {
      const msg = `Pipeline does not contain [${approvalStateName}] stage`;
      await putJobFailureResult(jobId, msg, context.invokeid);
      context.fail(msg);
    }

    const actionStates = approvalState.actionStates;
    console.log(`actionStates: ${JSON.stringify(actionStates)}`);

    const approvers = actionStates.map(_ => _.latestExecution && _.latestExecution.lastUpdatedBy).filter(_ => !!_);

    if (!approvers || approvers.length === 0) {
      const msg = `No approver! Action Stages: [${actionStates}]`;
      await putJobFailureResult(jobId, msg, context.invokeid);
      context.fail(msg);
    }

    if (doesDuplicatedApproverExist(approvers)) throw Error(`Duplicated approver exists! Approvers: [${approvers}]`);

    await codepipeline.putJobSuccessResult({ jobId: jobId }).promise();

    callback(null, `Put job ${jobId} success`);
  } catch (err) {
    console.error(err);
    callback(err);
  }
};
