import { AuthModule } from '@modules/auth/auth.module';
import { UserModule } from '@modules/user/user.module';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from '@modules/prisma/prisma.module';
import { AccessTokenBlacklistGuard } from '@guards/blacklist.guard';
import { JwtModule } from '@nestjs/jwt';
import { PlaygroundModule } from '@modules/playground/playground.module';
import { SocketModule } from '@modules/socket/socket.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.register(),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      subscriptions: {
        'graphql-ws': true,
      },
      autoSchemaFile: 'src/schemas/schema.gql',
      graphiql: true,
      context: ({ req, res }) => {
        return {
          req,
          res,
        };
      },
      formatError(formattedError) {
        console.error('[GraphQL Error]', {
          message: formattedError.message,
          path: formattedError.path,
          extensions: formattedError.extensions,
          originalError: formattedError.extensions.originalError,
        });

        return {
          message: formattedError.message,
          path: formattedError.path,
          extensions: {
            status: formattedError.extensions.status,
            exception: formattedError.extensions.originalError,
          },
        };
      },
    }),

    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: () => ({
        errorMessage: 'Too many requests! Please try again later',
        throttlers: [
          {
            limit: 10,
            ttl: 1000,
          },
        ],
      }),
    }),

    ScheduleModule.forRoot(),
    AuthModule,
    UserModule,
    PrismaModule,
    JwtModule.register({}),
    PlaygroundModule,
    SocketModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // {
    //   provide: APP_GUARD,
    //   useClass: GqlThrottlerGuard,
    // },
    { provide: APP_GUARD, useClass: AccessTokenBlacklistGuard },
  ],
})
export class AppModule {}
