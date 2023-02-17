import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SSM } from 'aws-sdk';
import { Parameter } from 'aws-sdk/clients/ssm';
import {
  AWS_PARAM_STORE_PATH,
  AWS_PARAM_STORE_PROVIDER,
  AWS_REGION,
} from './constants';
import { ModuleAsyncOptions, ModuleOptions } from './interface';
import { ParamStoreService } from './param-store.service';

@Global()
@Module({})
export class ParamStoreModule {
  public static register(moduleOptions: ModuleOptions): DynamicModule {
    return {
      module: ParamStoreModule,
      providers: [ParamStoreService, ...this.createProviders(moduleOptions)],
      exports: [ParamStoreService],
    };
  }

  public static registerAsync(
    moduleAsyncOptions: ModuleAsyncOptions,
  ): DynamicModule {
    return {
      module: ParamStoreModule,
      providers: [
        ParamStoreService,
        ...this.createAsyncProviders(moduleAsyncOptions),
      ],
      exports: [ParamStoreService],
    };
  }

  private static createProviders(moduleOptions: ModuleOptions): Provider[] {
    return [
      {
        provide: AWS_PARAM_STORE_PROVIDER,
        useFactory: async (): Promise<Parameter[]> => {
          return await ParamStoreModule.getSSMParameters(
            moduleOptions.awsRegion,
            moduleOptions.awsParamSorePath,
          );
        },
      },
    ];
  }

  private static createAsyncProviders(
    moduleAsyncOptions: ModuleAsyncOptions,
  ): Provider[] {
    return [
      {
        provide: AWS_PARAM_STORE_PROVIDER,
        useFactory: async (
          configService: ConfigService,
        ): Promise<Parameter[]> => {
          return await ParamStoreModule.getSSMParameters(
            configService.get(AWS_REGION),
            configService.get(AWS_PARAM_STORE_PATH),
          );
        },
        inject: [moduleAsyncOptions.useClass],
      },
    ];
  }

  private static async getSSMParameters(
    awsRegion: string,
    awsParamSorePath: string,
  ): Promise<Parameter[]> {
    const parameters = [];
    let nextToken = null;
    let result = null;

    const ssmClient = new SSM({
      region: awsRegion,
    });
    result = await ssmClient
      .getParametersByPath({
        Path: awsParamSorePath,
        Recursive: true,
        WithDecryption: true,
      })
      .promise();
    parameters.push(...result?.Parameters);
    nextToken = result.NextToken;
    while (!!nextToken) {
      result = await ssmClient
        .getParametersByPath({
          NextToken: nextToken,
          Path: awsParamSorePath,
          Recursive: true,
          WithDecryption: true,
        })
        .promise();
      parameters.push(...result?.Parameters);
      nextToken = result.NextToken;
    }
    return parameters;
  }
}
