FROM node:18

# Set work directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY . ./

# Accept the environment variables as build arguments
ARG NODE_ENV
ARG ENVIRONMENT
ARG PORT
ARG APP_BASE_URL
ARG SECRET_KEY
ARG DATABASE_URL
ARG SENDGRID_API_KEY
ARG JWT_SECRET_KEY
ARG JWT_REFRESH_SECRET_KEY
ARG MOLLIE_API_KEY

# Export the environment variables so that they are available for the build script
ENV NODE_ENV=$NODE_ENV
ENV ENVIRONMENT=$ENVIRONMENT
ENV PORT=$PORT
ENV APP_BASE_URL=$APP_BASE_URL
ENV SECRET_KEY=$SECRET_KEY
ENV DATABASE_URL=$DATABASE_URL
ENV SENDGRID_API_KEY=$SENDGRID_API_KEY
ENV JWT_SECRET_KEY=$JWT_SECRET_KEY
ENV JWT_REFRESH_SECRET_KEY=$JWT_REFRESH_SECRET_KEY
ENV MOLLIE_API_KEY=$MOLLIE_API_KEY

# Clean and Install dependencies again (if any devDependencies are needed during the build)
RUN rm -rf node_modules/
RUN npm install

# Build the app
RUN npm run build

# Set the start command
CMD [ "npm", "start" ]
