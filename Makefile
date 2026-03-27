.PHONY: deploy deploy-prod deploy-canary

deploy:
	source ~/.nvm/nvm.sh && nvm use default && npm run deploy:prod

deploy-prod:
	source ~/.nvm/nvm.sh && nvm use default && npm run deploy:prod

deploy-canary:
	source ~/.nvm/nvm.sh && nvm use default && npm run deploy:canary
