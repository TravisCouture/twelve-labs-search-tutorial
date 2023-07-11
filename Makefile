setup-env:
	npm i vite
	npm create vite@latest twelve-labs-search -- --template react
	cd twelve-labs-search; npm install; npm install ytdl-core; npm install stream-browserify; npm install @mui/material @emotion/react @emotion/styled; npm install @mui/icons-material
destory-env:
	rm package.json
	rm package-lock.json
	rm -r node_modules
	rm -f -r twelve-labs-search
run-dev:
	cd twelve-labs-search; npx vite --host
