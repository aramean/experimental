SHELL := /bin/bash
ARGS = $(filter-out $@,$(MAKECMDGOALS))
NIGHTLY = ../../front/nightly/

# PATH TO FRONT.JS
JS_FILE := front.js
TAG := $(shell grep -o 'build:[[:space:]]*[0-9]*' $(JS_FILE) | awk -F':' '{ print $$2+1 }')

release:
	@cp front.js $(NIGHTLY)
	@cp -fr plugins $(NIGHTLY)
	@cp -fr modules $(NIGHTLY)
	@echo "Release: $(TAG) ..."
	@cd $(NIGHTLY) && git add . && git commit -m "Build $(TAG)" && git push --force

%:
	@: