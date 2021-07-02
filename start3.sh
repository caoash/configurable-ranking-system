export FLASK_APP=api
export FLASK_ENV=development

(trap 'kill 0' SIGINT; python -m flask3 run & npm start --prefix frontend/configurable-ranking)
