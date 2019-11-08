# `@atomist/version-goal`

Atomist SDM Goal to use as a container goal to version projects.

## Usage

Use the goal with the following container goal definition:

```yaml
version: 
      
  goals: 
  - containers:  
      name: version
      image: atomist/version-goal
    output:
    - classifier: cache
      pattern:
        glob_pattern:
        - pom.xml
        - package.json
```

## Support

General support questions should be discussed in the `#support`
channel in our community Slack workspace
at [atomist-community.slack.com][slack].

If you find a problem, please create an [issue][].

[issue]: https://github.com/atomist/sdm-base/issues

## Development

See the [Atomist developer documentation][atomist-dev] for information
on how to write your own SDM features and automations.

[atomist-dev]: https://docs.atomist.com/developer/ (Atomist Developer Documentation)

### Release

Releases are handled via the SDM itself.  Just press the release
button in Slack or the Atomist dashboard.

---

Created by [Atomist][atomist].
Need Help?  [Join our Slack team][slack].

[atomist]: https://atomist.com/ (Atomist - How Teams Deliver Software)
[slack]: https://join.atomist.com/ (Atomist Community Slack)
