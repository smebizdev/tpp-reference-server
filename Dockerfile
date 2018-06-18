FROM openbankinguk/node:latest

RUN apk update && apk upgrade && \
    apk add --no-cache bash git curl

WORKDIR /home/node/app
RUN mkdir /home/node/app/tpp-reference-server
COPY . /home/node/app/tpp-reference-server
WORKDIR /home/node/app/tpp-reference-server

RUN npm install

EXPOSE 8003
CMD ["npm", "run", "foreman"]
