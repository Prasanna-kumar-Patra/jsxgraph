class Logger {
    static LEVELS = {
        DEBUG: 0,
        INFO: 1,
        WARN: 2,
        ERROR: 3
    };

    static currentLevel = Logger.LEVELS.DEBUG;

    static setLevel(level) {
        Logger.currentLevel = level;
    }

    static formatMessage(level, message, data = null) {
        const timestamp = new Date().toISOString();
        let formattedMsg = `[${timestamp}] [${level}] ${message}`;
        if (data) {
            formattedMsg += `\nData: ${JSON.stringify(data, null, 2)}`;
        }
        return formattedMsg;
    }

    static debug(message, data = null) {
        if (Logger.currentLevel <= Logger.LEVELS.DEBUG) {
            console.debug(Logger.formatMessage('DEBUG', message, data));
        }
    }

    static info(message, data = null) {
        if (Logger.currentLevel <= Logger.LEVELS.INFO) {
            console.info(Logger.formatMessage('INFO', message, data));
        }
    }

    static warn(message, data = null) {
        if (Logger.currentLevel <= Logger.LEVELS.WARN) {
            console.warn(Logger.formatMessage('WARN', message, data));
        }
    }

    static error(message, error = null, data = null) {
        if (Logger.currentLevel <= Logger.LEVELS.ERROR) {
            console.error(Logger.formatMessage('ERROR', message, data));
            if (error) {
                console.error(error);
            }
        }
    }
}
