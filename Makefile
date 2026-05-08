SHELL := /bin/bash
ARGS = $(filter-out $@,$(MAKECMDGOALS))

default:
	@git pull && git add . && git commit --allow-empty-message -m '' && git push

install-hooks:
	@echo "Installing Git hooks..."
	@cp .githooks/pre-commit .git/hooks/pre-commit
	@chmod +x .git/hooks/pre-commit
	@echo "Pre-commit hook installed."

setup-db:
	@echo "Setting up database connection..."
	@read -p "SSH host: " host; \
	read -p "SSH port [22]: " sshport; sshport=$${sshport:-22}; \
	read -p "DB port [5432]: " port; port=$${port:-5432}; \
	read -p "DB local port [5432]: " lport; lport=$${lport:-5432}; \
	read -p "DB name: " db; \
	read -p "DB user: " user; \
	read -sp "DB password: " pass; echo; \
	mkdir -p ~/.config; \
	echo "DB_HOST=$$host" > ~/.config/db.env; \
	echo "DB_SSH_PORT=$$sshport" >> ~/.config/db.env; \
	echo "DB_PORT=$$port" >> ~/.config/db.env; \
	echo "DB_LOCAL_PORT=$$lport" >> ~/.config/db.env; \
	echo "DB_NAME=$$db" >> ~/.config/db.env; \
	echo "DB_USER=$$user" >> ~/.config/db.env; \
	echo "DB_PASS=$$pass" >> ~/.config/db.env; \
	chmod 600 ~/.config/db.env; \
	echo "localhost:$$lport:$$db:$$user:$$pass" >> ~/.pgpass; \
	chmod 600 ~/.pgpass; \
	mkdir -p ~/.kiro/settings; \
	echo '#!/bin/bash' > ~/.config/db-mcp.sh; \
	echo 'source ~/.config/db.env' >> ~/.config/db-mcp.sh; \
	echo 'npx -y @modelcontextprotocol/server-postgres "postgresql://$$DB_USER:$$DB_PASS@localhost:$$DB_LOCAL_PORT/$$DB_NAME"' >> ~/.config/db-mcp.sh; \
	chmod 700 ~/.config/db-mcp.sh; \
	echo '{"mcpServers":{"postgres":{"command":"bash","args":["'"$$HOME"'/.config/db-mcp.sh"]}}}' > ~/.kiro/settings/mcp.json; \
	echo "Done. Run 'make start-db-tunnel' to connect."

start-db-tunnel:
	@source ~/.config/db.env && ssh -f -N -L $$DB_LOCAL_PORT:localhost:$$DB_PORT $$DB_HOST
	@echo "SSH tunnel open"

stop-db-tunnel:
	@pkill -f "ssh -f -N -L" || echo "No tunnel running"

%:
	@:
