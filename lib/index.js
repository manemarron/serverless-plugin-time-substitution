'use strict';

const defaultPatternShort = '##time##'
const defaultPatternLong = '##time_long##'
const hook = 'after:aws:package:finalize:mergeCustomProviderResources';

module.exports = class ServerlessPluginTimeSubstitution {
    constructor(serverless) {
        this.serverless = serverless;
        this.log = this.serverless.cli.consoleLog;
        this.patterns = getPatterns(this.serverless.service);
        this.handle = this.handle.bind(this);
        this.hooks = {
            [hook]: this.handle,
        };
    }

    handle() {
        const template = this.serverless.service.provider.compiledCloudFormationTemplate;
        const time = this.getTime()
        const { short, long } = this.patterns;
        this.log(`Substituting '${short}' to '${formatTimeYYYYMMDDhhmmss(time)}' in cloudformation template`)
        this.log(`Substituting '${long}' to '${formatTimeStandard(time)}' in cloudformation template`)
        const processedTemplate = JSON.stringify(template)
            .replace(short, formatTimeYYYYMMDDhhmmss(time))
            .replace(long, formatTimeStandard(time));
        this.serverless.service.provider.compiledCloudFormationTemplate = JSON.parse(processedTemplate);
    }

    /* istanbul ignore next */
    getTime() {
        return new Date();
    }
};

function getPatterns(service) {
    function getPattern(config, defaultPattern) {
        if (!config) {
            return new RegExp(defaultPattern, 'g');
        }
        return new RegExp(config, 'g');
    }
    let short = null;
    let long = null;
    if (service.custom && service.custom.timeSubstitution) {
        const { patternShort, patternLong } = service.custom.timeSubstitution;
        short = patternShort;
        long = patternLong;
    }
    return {
        short: getPattern(short, defaultPatternShort),
        long: getPattern(long, defaultPatternLong),
    };
}

function formatTimeYYYYMMDDhhmmss(time) {
    return time.getFullYear().toString() +
        padInteger(time.getMonth() + 1) +
        padInteger(time.getDate()) +
        padInteger(time.getHours()) +
        padInteger(time.getMinutes()) +
        padInteger(time.getSeconds());
}

function formatTimeStandard(time) {
    return time.toString();
}

function padInteger(number) {
    return number < 10 ? `0${number}` : number.toString();
}
