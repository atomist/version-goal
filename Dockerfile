FROM atomist/sdm-base:0.3.0

RUN apt-get update && apt-get install -y \
        openjdk-8-jdk-headless \
        maven \
        gradle \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./

RUN npm ci \
    && npm cache clean --force

COPY . ./

ENTRYPOINT ["node", "/sdm/node_modules/@atomist/goal/bin/start.js"]
