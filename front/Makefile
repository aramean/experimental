SHELL := /bin/bash
ARGS = $(filter-out $@,$(MAKECMDGOALS))
NIGHTLY = ../../front/nightly/

# PATH TO FRONT.JS
JS_FILE := front.js
MIN_FILE := front.min.js
TAG := $(shell grep -o 'build:[[:space:]]*[0-9]*' $(JS_FILE) | awk -F':' '{ print $$2+1 }')

release: precommit minify
	@sed -E 's/(build:[[:space:]]+)[0-9]+/\1$(TAG)/g' ${JS_FILE} > temp_file && mv temp_file ${JS_FILE}
	@echo "Release: $(TAG) ..."
	@cp front.js $(NIGHTLY)
	@cp front.min.js $(NIGHTLY)
	@cp -fr plugins $(NIGHTLY)
	@cp -fr modules $(NIGHTLY)
	@cd $(NIGHTLY) && git add . && git commit -m "Build $(TAG)" && git push --force

precommit:
	@git add . && git commit --allow-empty-message -m ''

# Pure Bash minify step
minify:
	@echo "Minifying ${JS_FILE}..."
	@sed -E 's#//.*$$##' ${JS_FILE} \
	| sed -E '/\/\*/,/\*\//d' \
	| sed -E 's/[[:space:]]+/ /g' \
	| sed -E 's/^[[:space:]]+//' \
	| sed -E 's/[[:space:]]+$$//' \
	| sed -E '/^$$/d' \
	> ${MIN_FILE}
	@echo "Minified JS saved to ${MIN_FILE}"

# Default target to prevent errors for unknown make goals
%:
	@: