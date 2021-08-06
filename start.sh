export FLASK_APP=api
export FLASK_ENV=development

(trap 'kill 0' SIGINT; python -m flask run --host=0.0.0.0 & HOST=0.0.0.0 npm start --prefix frontend/configurable-ranking)
