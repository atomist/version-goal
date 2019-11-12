FROM atomist/sdm-base:0.3.0

RUN apt-get update && apt-get install -y \
        openjdk-8-jdk-headless \
        maven \
        gradle \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./

ENV NODE_ENV development

RUN npm ci \
    && npm cache clean --force

COPY . ./

RUN npm run compile

ENV NODE_ENV production

ENTRYPOINT ["node", "/sdm/node_modules/@atomist/goal/bin/start.js"]
