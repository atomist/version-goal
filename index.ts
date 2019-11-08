/*
 * Copyright © 2019 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
    configureLogging,
    GitCommandGitProject,
    GitHubRepoRef,
    GitProject,
    PlainLogging,
} from "@atomist/automation-client";
import {
    LoggingProgressLog,
    ProgressLog,
    SdmGoalEvent,
} from "@atomist/sdm";
import { ProjectVersioner } from "@atomist/sdm-core";
import { NodeProjectVersioner } from "@atomist/sdm-pack-node";
import { MavenProjectVersioner } from "@atomist/sdm-pack-spring";
import { FileVersioner } from "@atomist/sdm-pack-version";
import { codeLine } from "@atomist/slack-messages";
import * as fs from "fs-extra";

async function logExecuteVersion(): Promise<number> {
    configureLogging(PlainLogging);
    const log = new LoggingProgressLog("version", "info");
    const status = await executeVersion(log);
    await log.close();
    return status;
}

async function executeVersion(log: ProgressLog): Promise<number> {
    if (!process.env.ATOMIST_GOAL || !process.env.ATOMIST_PROJECT_DIR || !process.env.ATOMIST_RESULT) {
        log.write(`Missing environment variables, aborting: ATOMIST_GOAL=${process.env.ATOMIST_GOAL} ` +
            `ATOMIST_PROJECT_DIR=${process.env.ATOMIST_PROJECT_DIR} ATOMIST_RESULT=${process.env.ATOMIST_RESULT}\n`);
        return 1;
    }
    const goal: SdmGoalEvent = await fs.readJson(process.env.ATOMIST_GOAL);
    const project: GitProject = await GitCommandGitProject.fromExistingDirectory(GitHubRepoRef.from({
        owner: goal.repo.owner,
        repo: goal.repo.name,
        branch: goal.branch,
        sha: goal.push.after?.sha || undefined,
    }), process.env.ATOMIST_PROJECT_DIR) as any;

    let versioner: ProjectVersioner | undefined;
    if (await project.hasFile("package.json")) {
        versioner = NodeProjectVersioner;
    } else if (await project.hasFile("pom.xml")) {
        versioner = MavenProjectVersioner;
    } else if (await project.hasFile(".version") || await project.hasFile("VERSION")) {
        versioner = FileVersioner;
    }
    if (!versioner) {
        log.write("No recognized version file found\n");
        return 1;
    }

    const version = await versioner(goal, project, log);
    log.write(`Calculated version ${version}\n`);
    const result = {
        SdmGoal: {
            description: `Versioned ${codeLine(version)}`,
            push: {
                after: {
                    version,
                },
            },
        },
    };
    await fs.writeJson(process.env.ATOMIST_RESULT, result);
    return 0;
}

logExecuteVersion()
    .then(code => process.exit(code))
    .catch(e => {
        process.stderr.write(`Unhandled error: ${e.message}\n`);
        process.stderr.write(e.stack);
        process.exit(102);
    });
