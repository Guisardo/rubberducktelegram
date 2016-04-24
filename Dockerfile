FROM node

COPY LICENSE LICENSE

COPY package.json package.json
RUN npm install --allow-root

ENV API_HOST rubberduckapi
ENV API_PORT 80

COPY server.js server.js

CMD ["node", "server.js"]