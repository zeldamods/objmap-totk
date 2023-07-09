FROM node:18
WORKDIR /objmap
COPY . .
RUN npm install --include=dev
CMD npm run serve
