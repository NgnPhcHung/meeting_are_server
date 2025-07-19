import { Query, Resolver } from '@nestjs/graphql';
import { UserService } from '../services/user.service';
import { UserModel } from '@modules/auth/models/user.model';
import { CurrentUser } from '@decorators/current-user';
import { Logged } from 'decologger';

@Resolver(() => UserModel)
@Logged()
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Query(() => UserModel)
  async getMe(@CurrentUser() userId: number) {
    const user = await this.userService.findById(userId);

    return user;
  }
}
