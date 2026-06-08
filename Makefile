.PHONY: build up down clean

build:
	docker build -t rbc-browser-agent:latest ./agent
	docker compose build

up:
	docker build -t rbc-browser-agent:latest ./agent
	docker compose up --build

down:
	docker compose down

clean:
	docker compose down
	-docker ps -a --filter "label=rbc.session" -q | xargs -r docker rm -f
	-docker network rm rbc-net 2>/dev/null || true
