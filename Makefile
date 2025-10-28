SHELL := /bin/bash
ARGS = $(filter-out $@,$(MAKECMDGOALS))

default:
	@git pull && git add . && git commit --allow-empty-message -m '' && git push

install-hooks:
	@echo "Installing Git hooks..."
	@cp .githooks/pre-commit .git/hooks/pre-commit
	@chmod +x .git/hooks/pre-commit
	@echo "Pre-commit hook installed."

%:
	@: