SHELL := /bin/bash
ARGS = $(filter-out $@,$(MAKECMDGOALS))

default:
	git pull && git add . && git commit --allow-empty-message -m '' && git push

%:
	@: