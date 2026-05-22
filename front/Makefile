SHELL := /bin/bash
ARGS = $(filter-out $@,$(MAKECMDGOALS))
NIGHTLY = ../../front/nightly/

# PATH TO FRONT.JS
JS_FILE := front.js
MIN_FILE := front.min.js
TAG := $(shell grep -o 'build:[[:space:]]*[0-9]*' $(JS_FILE) | awk -F':' '{ print $$2+1 }')
VERSION := $(shell grep 'frontVersion' $(JS_FILE) | grep -oE '[0-9]+' | head -3 | paste -sd '.' -)

default: precommit minify
	@sed -E 's/(build:[[:space:]]+)[0-9]+/\1$(TAG)/g' ${JS_FILE} > temp_file && mv temp_file ${JS_FILE}
	@echo "Build: $(TAG)"
	@cp front.js $(NIGHTLY)
	@cp front.min.js $(NIGHTLY)
	@cp -fr plugins $(NIGHTLY)
	@cp -fr modules $(NIGHTLY)
	@cd $(NIGHTLY) && git add . && git commit -m "Build $(TAG)" && git push --force

release: default
	@if git ls-remote --tags origin | grep -q "refs/tags/v$(VERSION)$$"; then echo "Error: Tag v$(VERSION) already exists in remote."; exit 1; fi
	@echo "Release v$(VERSION) (Build $(TAG))?"
	@read -p "Confirm [y/n]: " ans && [ "$$ans" = "y" ] || exit 1
	@echo "Releasing..."
	@git tag -a v$(VERSION) -m "v$(VERSION)" && git push origin v$(VERSION)

precommit:
	@git add . && git commit --allow-empty-message -m ''

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

%:
	@:
