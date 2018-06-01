FROM node:8.11.1-alpine

# Backup repository if the main one doesn't work
# RUN echo http://mirror.yandex.ru/mirrors/alpine/v3.5/main > /etc/apk/repositories; \
#     echo http://mirror.yandex.ru/mirrors/alpine/v3.5/community >> /etc/apk/repositories

RUN apk update && apk upgrade && \
    apk add --no-cache bash git curl

WORKDIR /home/node/app
RUN chown -R node:node /home/node/app
USER node:node

# ARG TAG_VERSION=master
# RUN git clone -b ${TAG_VERSION} --single-branch https://github.com/OpenBankingUK/tpp-reference-server.git /home/node/app/tpp-reference-server

RUN mkdir /home/node/app/tpp-reference-server
COPY . /home/node/app/tpp-reference-server
WORKDIR /home/node/app/tpp-reference-server

RUN npm install

EXPOSE 8003
CMD ["npm", "run", "foreman"]
