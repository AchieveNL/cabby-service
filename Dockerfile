FROM node:18

# Set work directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY . ./

RUN rm -rf node_modules/

RUN npm install

# Build the app (Optional: Based on your build script)
RUN npm run build

# Set the start command
CMD [ "npm", "start" ]
