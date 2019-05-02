'use strict';
const Plugin = require('.');

describe('Plugin', () => {
    describe('constructor', () => {
        const template = { foo: 'bar' };
        let serverless;

        beforeEach(() => {
            serverless = {
                cli: { consoleLog: jest.fn() },
                pluginManager: { hooks: {}},
                service: {
                    provider: {
                        compiledCloudFormationTemplate: template,
                    },
                },
            };
        });

        it('should set serverless property of instance', () => {
            // Act
            const instance = new Plugin(serverless);

            // Assert
            expect(instance.serverless).toEqual(serverless);
        });

        it('should set log property of instance', () => {
            // Act
            const instance = new Plugin(serverless);

            // Assert
            expect(instance.log).toEqual(serverless.cli.consoleLog);
        });

        it('should set correct hook in serverless instance', () => {
            // Act
            const instance = new Plugin(serverless);

            // Assert
            expect(instance.hooks).toEqual({
                'after:aws:package:finalize:mergeCustomProviderResources': instance.handle,
            });
        });

        it('should set default patterns if serverless.service.custom property is not defined', () => {
            // Arrange
            serverless.service.custom = null;

            // Act
            const instance = new Plugin(serverless);

            // Assert
            expect(instance.patterns).toEqual({
                short: new RegExp('##time##', 'g'),
                long: new RegExp('##time_long##', 'g'),
            });
        });

        it('should set default patterns if serverless.service.custom.timeSubstitution property is not defined', () => {
            // Arrange
            serverless.service.custom = {};

            // Act
            const instance = new Plugin(serverless);

            // Assert
            expect(instance.patterns).toEqual({
                short: new RegExp('##time##', 'g'),
                long: new RegExp('##time_long##', 'g'),
            });
        });

        it('should set default short pattern if serverless.service.custom.timeSubstitution.patternShort property is not defined', () => {
            // Arrange
            serverless.service.custom = {
                timeSubstitution: {
                    patternLong: 'some pattern',
                },
            };

            // Act
            const instance = new Plugin(serverless);

            // Assert
            expect(instance.patterns.short).toEqual(new RegExp('##time##', 'g'));
        });

        it('should set default long pattern if serverless.service.custom.timeSubstitution.patternLong property is not defined', () => {
            // Arrange
            serverless.service.custom = {
                timeSubstitution: {
                    patternShort: 'some pattern',
                },
            };

            // Act
            const instance = new Plugin(serverless);

            // Assert
            expect(instance.patterns.long).toEqual(new RegExp('##time_long##', 'g'));
        });

        it('should set configured short pattern if serverless.service.custom.timeSubstitution.patternShort is present', () => {
            // Arrange
            serverless.service.custom = {
                timeSubstitution: {
                    patternShort: 'some pattern',
                },
            };

            // Act
            const instance = new Plugin(serverless);

            // Assert
            expect(instance.patterns.short).toEqual(new RegExp('some pattern', 'g'));
        });

        it('should set configured long pattern if serverless.service.custom.timeSubstitution.patternLong is present', () => {
            // Arrange
            serverless.service.custom = {
                timeSubstitution: {
                    patternLong: 'some pattern',
                },
            };

            // Act
            const instance = new Plugin(serverless);

            // Assert
            expect(instance.patterns.long).toEqual(new RegExp('some pattern', 'g'));
        });
    });

    describe('handle', () => {
        let systemUnderTest;

        beforeEach(() => {
            const serverless = {
                cli: { consoleLog: jest.fn() },
                pluginManager: { hooks: {}},
                service: {
                    provider: {
                        compiledCloudFormationTemplate: {
                            Resources: {
                                'APIGatewayDeployment_##time##': {
                                    Type: 'AWS::APIGateway::Deployment',
                                    Properties: {
                                        Description: 'Description ##time_long##',
                                    },
                                },
                            },
                        },
                    },
                },
            };
            systemUnderTest = new Plugin(serverless);
        });

        it('should update serverless.provider.compiledCloudFormationTemplate correctly', () => {
            // Arrange
            const date = new Date("Thu Jan 31 1980 12:30:16 GMT-0600 (GMT-06:00)");
            systemUnderTest.getTime = jest.fn(() => date);

            // Act
            systemUnderTest.handle();

            // Assert
            expect(systemUnderTest.serverless.service.provider.compiledCloudFormationTemplate).toEqual({
                Resources: {
                    APIGatewayDeployment_19800131123016: {
                        Type: 'AWS::APIGateway::Deployment',
                        Properties: {
                            Description: 'Description Thu Jan 31 1980 12:30:16 GMT-0600 (GMT-06:00)',
                        },
                    },
                },
            });
        });
    });
});
