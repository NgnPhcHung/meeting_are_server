import { Public } from '@decorators/public';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GraphQLContext } from '@types';
import { SignInDto } from './dtos/signin.dto';
import { SignUpDto } from './dtos/signup.dto';
import { AuthResponse } from './models/auth-response.model';
import { UserModel } from './models/user.model';
import { AuthService } from './services/auth.service';
import { Logged } from 'decologger';

@Resolver(() => UserModel)
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @Public()
  @Mutation(() => AuthResponse)
  async login(@Args('input') input: SignInDto): Promise<AuthResponse> {
    return this.authService.login(input);
  }

  @Public()
  @Mutation(() => AuthResponse)
  async register(@Args('input') input: SignUpDto): Promise<AuthResponse> {
    return this.authService.signUp(input);
  }

  @Public()
  @Mutation(() => AuthResponse)
  @Logged({
    formatter(data) {
      return `Called  refreshAccessToken`;
    },
  })
  async refreshAccessToken(@Context() context: GraphQLContext) {
    const { req, res } = context;
    const refreshToken = req.cookies['refreshToken'];
    console.log('refreshToken', refreshToken);
    const accessToken = await this.authService.refreshAccessToken(refreshToken);

    res.cookie('authorization', `Bearer ${accessToken}`, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: Number(process.env.ACCESS_HEADER_EXPIRED_IN),
    });
    return { accessToken };
  }

  @Query(() => String)
  ping() {
    return 'pong';
  }
}
