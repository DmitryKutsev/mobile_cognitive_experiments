.DEFAULT_GOAL := help
PORT ?= 8081

.PHONY: help install test run run_dev

help:
	@echo "make install  Install locked dependencies"
	@echo "make test     Run TypeScript checks and protocol tests"
	@echo "make run      Start the local browser development server"
	@echo "make run_dev  Same as make run (PORT=8081 by default)"

install:
	npm ci

test:
	npm run check

run run_dev:
	npm run web -- --host localhost --port $(PORT)
