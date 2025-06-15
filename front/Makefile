SHELL := /bin/bash
ARGS = $(filter-out $@,$(MAKECMDGOALS))
NIGHTLY = ../../front/nightly/

# PATH TO FRONT.JS
JS_FILE := front.js
TAG := $(shell grep -o 'build:[[:space:]]*[0-9]*' $(JS_FILE) | awk -F':' '{ print $$2+1 }')

default:
	@echo "Build: $(TAG) ..."
	@sed -E 's/(build:[[:space:]]+)[0-9]+/\1$(TAG)/g' ${JS_FILE} > temp_file && mv temp_file ${JS_FILE}
	@echo "Pushing to repository ..."
	@git pull && git add . && git commit --allow-empty-message -m '' && git push

release:
	@cp front.js $(NIGHTLY)
	@cp -fr plugins $(NIGHTLY)
	@cp -fr modules $(NIGHTLY)
	@echo "Release: $(TAG) ..."
	@cd $(NIGHTLY) && git add . && git commit -m "Build $(TAG)" && git push --force

%:
	@: