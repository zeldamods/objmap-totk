FROM node:26
WORKDIR /objmap
COPY . .
RUN npm install --include=dev
CMD npm run serve -- --host
