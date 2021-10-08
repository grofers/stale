import * as core from '@actions/core';
import {IssuesProcessor} from './classes/issues-processor';
import {isValidDate} from './functions/dates/is-valid-date';
import {IIssuesProcessorOptions} from './interfaces/issues-processor-options';
import {Issue} from './classes/issue';

async function _run(): Promise<void> {
  try {
    const args = _getAndValidateArgs();

    const issueProcessor: IssuesProcessor = new IssuesProcessor(args);
    await issueProcessor.processIssues();

    await processOutput(
      issueProcessor.staleIssues,
      issueProcessor.closedIssues
    );
  } catch (error) {
    core.error(error);
    core.setFailed(error.message);
  }
}

function _getAndValidateArgs(): IIssuesProcessorOptions {
  const args: IIssuesProcessorOptions = {
    repoToken: core.getInput('repo-token'),
    staleIssueMessage: core.getInput('stale-issue-message'),
    stalePrMessage: core.getInput('stale-pr-message'),
    closeIssueMessage: core.getInput('close-issue-message'),
    closePrMessage: core.getInput('close-pr-message'),
    daysBeforeIssueStale: parseInt(
      core.getInput('days-before-issue-stale', {required: true})
    ),
    daysBeforePrStale: parseInt(
      core.getInput('days-before-pr-stale', {required: true})
    ),
    daysBeforeIssueClose: parseInt(
      core.getInput('days-before-issue-close', {required: true})
    ),
    daysBeforePrClose: parseInt(
      core.getInput('days-before-pr-close', {required: true})
    ),
    staleIssueLabel: core.getInput('stale-issue-label', {required: true}),
    closeIssueLabel: core.getInput('close-issue-label'),
    exemptIssueLabels: core.getInput('exempt-issue-labels'),
    stalePrLabel: core.getInput('stale-pr-label', {required: true}),
    closePrLabel: core.getInput('close-pr-label'),
    exemptPrLabels: core.getInput('exempt-pr-labels'),
    onlyIssueLabels: core.getInput('only-issue-labels'),
    onlyPrLabels: core.getInput('only-pr-labels'),
    anyOfIssueLabels: core.getInput('any-of-issue-labels'),
    anyOfPrLabels: core.getInput('any-of-pr-labels'),
    operationsPerRun: parseInt(
      core.getInput('operations-per-run', {required: true})
    ),
    removeStaleWhenUpdated: !(
      core.getInput('remove-stale-when-updated') === 'false'
    ),
    removeIssueStaleWhenUpdated: _toOptionalBoolean(
      'remove-issue-stale-when-updated'
    ),
    removePrStaleWhenUpdated: _toOptionalBoolean(
      'remove-pr-stale-when-updated'
    ),
    debugOnly: core.getInput('debug-only') === 'true',
    ascending: core.getInput('ascending') === 'true',
    deleteBranch: core.getInput('delete-branch') === 'true',
    startDate:
      core.getInput('start-date') !== ''
        ? core.getInput('start-date')
        : undefined,
    exemptIssueMilestones: core.getInput('exempt-issue-milestones'),
    exemptPrMilestones: core.getInput('exempt-pr-milestones'),
    exemptAllIssueMilestones:
      core.getInput('exempt-all-issue-milestones') === 'true',
    exemptAllPrMilestones: core.getInput('exempt-all-pr-milestones') === 'true',
    exemptIssueAssignees: core.getInput('exempt-issue-assignees'),
    exemptPrAssignees: core.getInput('exempt-pr-assignees'),
    exemptAllIssueAssignees:
      core.getInput('exempt-all-issue-assignees') === 'true',
    exemptAllPrAssignees: core.getInput('exempt-all-pr-assignees') === 'true',
    enableStatistics: core.getInput('enable-statistics') === 'true',
    labelsToRemoveWhenUnstale: core.getInput('labels-to-remove-when-unstale'),
    labelsToAddWhenUnstale: core.getInput('labels-to-add-when-unstale'),
    ignoreIssueUpdates: core.getInput('ignore-issue-updates') === 'true',
    ignorePrUpdates: core.getInput('ignore-pr-updates') === 'true',
    exemptDraftPr: core.getInput('exempt-draft-pr') === 'true'
  };

  for (const numberInput of [
    'days-before-issue-stale',
    'days-before-pr-stale',
    'days-before-issue-close',
    'days-before-pr-close',
    'operations-per-run'
  ]) {
    if (isNaN(parseInt(core.getInput(numberInput)))) {
      const errorMessage = `Option "${numberInput}" did not parse to a valid integer`;
      core.setFailed(errorMessage);
      throw new Error(errorMessage);
    }
  }

  for (const optionalDateInput of ['start-date']) {
    // Ignore empty dates because it is considered as the right type for a default value (so a valid one)
    if (core.getInput(optionalDateInput) !== '') {
      if (!isValidDate(new Date(core.getInput(optionalDateInput)))) {
        const errorMessage = `Option "${optionalDateInput}" did not parse to a valid date`;
        core.setFailed(errorMessage);
        throw new Error(errorMessage);
      }
    }
  }

  return args;
}

async function processOutput(
  staledIssues: Issue[],
  closedIssues: Issue[]
): Promise<void> {
  core.setOutput('staled-issues-prs', JSON.stringify(staledIssues));
  core.setOutput('closed-issues-prs', JSON.stringify(closedIssues));
}

/**
 * @description
 * From an argument name, get the value as an optional boolean
 * This is very useful for all the arguments that override others
 * It will allow us to easily use the original one when the return value is `undefined`
 * Which is different from `true` or `false` that consider the argument as set
 *
 * @param {Readonly<string>} argumentName The name of the argument to check
 *
 * @returns {boolean | undefined} The value matching the given argument name
 */
function _toOptionalBoolean(
  argumentName: Readonly<string>
): boolean | undefined {
  const argument: string = core.getInput(argumentName);

  if (argument === 'true') {
    return true;
  } else if (argument === 'false') {
    return false;
  }

  return undefined;
}

void _run();
