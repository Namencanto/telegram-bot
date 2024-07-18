
# Telegram Key Selling Bot

This bot is designed to facilitate the sale of keys via Telegram. It provides a seamless and user-friendly interface for both sellers and buyers to manage and purchase keys.

## Requirements

- Node.js version 20.x
- NPM (Node Package Manager)

## Installation

1. Set Node.js to version 20:
   ```bash
   nvm install 20
   nvm use 20
   ```

2. Install required dependencies:
   ```bash
   npm install
   ```

3. Configure the environment file `.env` based on the `env.example` file:
   ```bash
   cp .env.example .env
   # Then edit the .env file and input the appropriate values
   ```

4. Run database migrations using Sequelize:
   ```bash
   npx sequelize-cli db:migrate
   ```

5. Start the bot:
   ```bash
   npm run start
   ```

## Usage

After completing the above steps, your Telegram bot should be up and running. You can now start testing and further developing it.

## Troubleshooting

If you encounter any issues during the installation or running of the bot, check the following:

- Do you have the correct version of Node.js installed?
- Are all dependencies installed correctly?
- Does the `.env` file contain all the necessary environment variables?
- Did the database migrations run without errors?

## Live Bot

You can interact with the live bot here: [Key Selling Bot](https://t.me/key_selling_bot)
