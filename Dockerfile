FROM node:26
WORKDIR /objmap
COPY . .
RUN npm install -g pnpm && pnpm install --frozen-lockfile
CMD pnpm run serve --host
