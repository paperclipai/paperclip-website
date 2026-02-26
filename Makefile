.PHONY: deploy

deploy:
	source ~/.nvm/nvm.sh && nvm use default && npm run build && wrangler pages deploy dist --commit-dirty=true
