SHELL := /bin/bash
ARGS = $(filter-out $@,$(MAKECMDGOALS))

default:
	echo "Pushing to repository ..."
	@git pull && git add . && git commit --allow-empty-message -m '' && git push

%:
	@: