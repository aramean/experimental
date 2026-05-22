SHELL := /bin/bash
ARGS = $(filter-out $@,$(MAKECMDGOALS))
NIGHTLY = ../../front/nightly/

# PATH TO FRONT.JS
JS_FILE := front.js
MIN_FILE := front.min.js
TAG := $(shell grep -o 'build:[[:space:]]*[0-9]*' $(JS_FILE) | awk -F':' '{ print $$2+1 }')

nightly: precommit minify
	@sed -E 's/(build:[[:space:]]+)[0-9]+/\1$(TAG)/g' ${JS_FILE} > temp_file && mv temp_file ${JS_FILE}
	@echo "Release: $(TAG) ..."
	@cp front.js $(NIGHTLY)
	@cp front.min.js $(NIGHTLY)
	@cp -fr plugins $(NIGHTLY)
	@cp -fr modules $(NIGHTLY)
	@cd $(NIGHTLY) && git add . && git commit -m "Build $(TAG)" && git push --force

release: precommit minify
	@if [ -z "$(VERSION)" ]; then echo "Usage: make release <version>"; exit 1; fi
	@sed -E 's/(build:[[:space:]]+)[0-9]+/\1$(TAG)/g' ${JS_FILE} > temp_file && mv temp_file ${JS_FILE}
	@echo "Release: $(VERSION) (Build $(TAG))"
	@git add . && git commit -m "$(VERSION)" && git push
	@git tag -a $(VERSION) -m "$(VERSION)" && git push origin $(VERSION)

precommit:
	@git add . && git commit --allow-empty-message -m ''

# Pure Bash minify step
minify:
	@echo "Minifying ${JS_FILE}..."
	@sed -E 's#//.*$$##' ${JS_FILE} \
	| sed -E '/\/\*/,/\*\//d' \
	| sed -E 's/^[[:space:]]+//' \
	| sed -E 's/[[:space:]]+$$//' \
	| sed -E 's/[[:space:]]+/ /g' \
	| sed -E '/^$$/d' \
	| perl -0777 -pe 's/([{,;])\n\s*/$$1/g' \
	| perl -0777 -pe 's/}\n\s*}/}}/g' \
	> ${MIN_FILE}
	@echo "Minified JS saved to ${MIN_FILE}"

# Default target to prevent errors for unknown make goals
%:
	@:
