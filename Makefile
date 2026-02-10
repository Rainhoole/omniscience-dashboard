.PHONY: up down logs db-push db-seed shell

up:
	docker compose up -d --build

down:
	docker compose down

logs:
	docker compose logs -f app

db-push:
	docker compose exec app npm run db:push

db-seed:
	docker compose exec app npm run db:seed

shell:
	docker compose exec app sh
