SHELL := /bin/bash
ARGS = $(filter-out $@,$(MAKECMDGOALS))
NIGHTLY = ../../front/nightly/

# PATH TO FRONT.JS
JS_FILE := front.js
TAG := $(shell grep -o 'build:[[:space:]]*[0-9]*' $(JS_FILE) | awk -F':' '{ print $$2+1 }')

release:
	@sed -E 's/(build:[[:space:]]+)[0-9]+/\1$(TAG)/g' ${JS_FILE} > temp_file && mv temp_file ${JS_FILE}
	@echo "Release: $(TAG) ..."
	@cp front.js $(NIGHTLY)
	@cp -fr plugins $(NIGHTLY)
	@cp -fr modules $(NIGHTLY)
	@cd $(NIGHTLY) && git add . && git commit -m "Build $(TAG)" && git push --force

%:
	@: