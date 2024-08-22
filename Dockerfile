FROM node:18

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . ./

ARG SENTRY_AUTH_TOKEN
ENV SENTRY_AUTH_TOKEN=${SENTRY_AUTH_TOKEN}
RUN npm run build

CMD [ "npm", "start" ]
