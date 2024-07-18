const requiredEnvs = [
    'DB_USER',
    'DB_PASSWORD',
    'DB_DATABASE',
    'DB_HOST',
    'DB_PORT',
    'NOWPAYMENTS_API_URL',
    'NOWPAYMENTS_API_KEY',
    'ADMIN_TELEGRAM_IDS',
    'MIN_DEPOSIT_AMOUNT',
    'BOT_TOKEN',
    'SPECIAL_PRICE_MULTIPLIER'
];

export function checkRequiredEnvs() {
    const missingEnvs = requiredEnvs.filter(envVar => !process.env[envVar]);

    if (missingEnvs.length > 0) {
        const missingEnvsList = missingEnvs.join(', ');
        throw new Error(`Missing environment variables: ${missingEnvsList}. Please set all required environment variables.`);
    }
}
