setup-env:
	npm i vite
	npm create vite@latest twelve-labs-search -- --template react
	cd twelve-labs-search; npm install; npm install nodemon -g
destroy-env:
	rm package.json
	rm package-lock.json
	rm -r node_modules
	rm -f -r twelve-labs-search
run-frontend:
	cd twelve-labs-search; npx vite --host
run-server:
	nodemon server.js
