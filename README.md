<h3 align="center">NestJS AWS SSM Param Store service</h3>
<br>
[![Node.js Package](https://github.com/typical-organization/param-store-service/actions/workflows/main.yml/badge.svg)](https://github.com/typical-organization/param-store-service/actions/workflows/main.yml)
<br>

Package to read parameters from AWS System Manager (SSM) parameter store. 
We can use "@nestjs/config" config service to read parameters from file and environment variables.
And use paramStoreService to read environment specific parameters like password or endpoint URL on application start up.

Module exports 'ParamStoreService' to access downloaded parameters. 
Service has method 'get' to read property.

Example:

```javascript
paramStoreService.get('nameOfProperty');
```

**Note**: 
1. If region (awsRegion) is not provided it defaults to 'us-east-1'.
2. awsParamSorePath is required.

### Installation

```bash
npm i param-store-service
```

### Configuration

Two ways to configure param-store-service module:

1. Static configuration
    ```javascript
    @Module({
        imports: [
            ParamStoreModule.register({
                awsRegion: 'us-east-1',
                awsParamSorePath: '/application/config',
            }),
        ],
        controllers: [AppController],
        providers: [AppService],
    })
    export class AppModule {
        constructor(
            private paramStoreService: ParamStoreService,
        ) {
            console.log('name', paramStoreService.get('name'));
        }
    }
    ```
2. Async configuration using config service
   1. Config service required properties:
      1. param-store.awsRegion
      2. param-store.awsParamStorePath
```javascript
@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [configServiceParamStoreConfiguration],
            envFilePath: `config/${process.env.NODE_ENV || 'development'}.env`,
            validate,
        }),
        ParamStoreModule.registerAsync({
            import: ConfigModule,
            useClass: ConfigService,
        }),
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {
    constructor(
        private paramStoreService: ParamStoreService,
    ) {
        console.log('name', paramStoreService.get('name'));
    }
}
  
```
Configuration to load for Config service
```javascript
import { registerAs } from '@nestjs/config';

export default registerAs('param-store', () => ({
  awsRegion: process.env.AWS_REGION,
  awsParamStorePath: process.env.AWS_PARAM_STORE_PATH,
}));
```

Validator (Optional)
```javascript
import { plainToClass } from 'class-transformer';
import { IsEnum, IsNumber, IsString, validateSync } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Test;

  @IsNumber()
  PORT = 3000;

  @IsString()
  AWS_REGION = 'us-east-1';

  @IsString()
  AWS_PARAM_STORE_PATH: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
```
.env file
```text
message='hello'
name='Old name'
description='Hello there!'
AWS_REGION='us-east-1'
AWS_PARAM_STORE_PATH='/application/config'
```
## Contributing

Contributions welcome!

## Author

**Parik**

## License

Licensed under the MIT License.
