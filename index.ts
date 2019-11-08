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
    SdmGoalEvent,
} from "@atomist/sdm";
import { NodeProjectVersioner } from "@atomist/sdm-pack-node";
import { MavenProjectVersioner } from "@atomist/sdm-pack-spring";
import { codeLine } from "@atomist/slack-messages";
import * as fs from "fs-extra";

configureLogging(PlainLogging);

async function executeVersion(): Promise<number> {
    const goal: SdmGoalEvent = await fs.readJson(process.env.ATOMIST_GOAL);
    const project: GitProject = await GitCommandGitProject.fromExistingDirectory(GitHubRepoRef.from({
        owner: goal.repo.owner,
        repo: goal.repo.name,
        branch: goal.branch,
        sha: goal.push.after.sha,
    }), process.env.ATOMIST_PROJECT_DIR) as any;
    const log = new LoggingProgressLog("version", "info");

    let version;
    if (await project.hasFile("package.json")) {
        version = await NodeProjectVersioner(goal, project, log);
    } else if (await project.hasFile("pom.xml")) {
        version = await MavenProjectVersioner(goal, project, log);
    }

    await log.close();

    if (!!version) {
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
    return 1;
}

executeVersion()
    .then(code => process.exit(code))
    .catch(e => {
        console.error(`Unhandled error: ${e.message}`);
        console.error(e.stack);
        process.exit(102);
    });
