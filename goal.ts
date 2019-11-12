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
    GoalExecutor,
    sdm,
    sdm_core,
} from "@atomist/goal";
import { NodeProjectVersioner } from "@atomist/sdm-pack-node";
import { MavenProjectVersioner } from "@atomist/sdm-pack-spring";
import { FileVersioner } from "@atomist/sdm-pack-version";
import { codeLine } from "@atomist/slack-messages";

/**
 * An SDM goal that extracts version strings from projects
 */
export const version: GoalExecutor = async gi => {

    const { goalEvent, project, progressLog } = gi;

    // Extract the version from the projects
    let versioner: sdm_core.ProjectVersioner | undefined;
    if (await project.hasFile("package.json")) {
        versioner = NodeProjectVersioner;
    } else if (await project.hasFile("pom.xml")) {
        versioner = MavenProjectVersioner;
    } else if (await project.hasFile(".version") || await project.hasFile("VERSION")) {
        versioner = FileVersioner;
    }
    if (!versioner) {
        progressLog.write("No recognized version file found");
        return {
            state: sdm.SdmGoalState.failure,
            description: "No recognized version file found",
        };
    }

    const v = await versioner(goalEvent, project, progressLog);

    // Push the version back into the project
    if (await project.hasFile("package.json")) {
        await gi.spawn("npm", ["version", "--no-git-tag-version", v]);
    }

    progressLog.write(`Calculated version ${v}`);

    return {
        description: `Versioned ${codeLine(v)}`,
        push: {
            after: {
                version: v,
            },
        },
    };
};
