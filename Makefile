SHELL=/bin/bash

.PHONY: test
all: test


.PHONY: deps_up
deps_up:
	@echo -e "\033[92m  ---> Starting Dependencies ...  \033[0m"
	docker-compose up -d --force-recreate --remove-orphans mongo redis refmockserver

.PHONY: deps_down
deps_down:
	@echo -e "\033[92m  ---> Stopping Dependencies ...  \033[0m"
	docker-compose down --volumes --remove-orphans


.PHONY: init_aspsps
init_aspsps:
	@echo -e "\033[92m  ---> Initialise list of ASPSPs ...  \033[0m"
	npm run updateAuthServersAndOpenIds
	npm run saveCreds authServerId=aaaj4NmBD8lQxmLh2O clientId=spoofClientId clientSecret=spoofClientSecret
	npm run saveCreds authServerId=bbbX7tUB4fPIYB0k1m clientId=spoofClientId clientSecret=spoofClientSecret
	npm run saveCreds authServerId=cccbN8iAsMh74sOXhk clientId=spoofClientId clientSecret=spoofClientSecret

.PHONY: test
test:
	make deps_up
	@echo -e "\033[92m  ---> Linting ... \033[0m"
	npm run eslint
	@echo -e "\033[92m  ---> Testing ...  \033[0m"
	npm run test
	make deps_down
