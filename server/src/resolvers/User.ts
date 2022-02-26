import {
  Arg,
  Ctx,
  Field,
  InputType,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from "type-graphql";
import argon2 from "argon2";
import { MyContext } from "../types";
import { User } from "../entities/User";

@InputType()
class UsernamePasswordInput {
  @Field()
  username: string;

  @Field()
  password: string;
}

@ObjectType()
class FieldError {
  @Field()
  field: string;

  @Field()
  msg: string;
}

@ObjectType()
class UserResponse {
  @Field(() => User, { nullable: true })
  user?: User;

  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
}

@Resolver()
export class UserResolver {
  @Query(() => User, { nullable: true })
  async me(@Ctx() { em, req }: MyContext) {
    console.log(req.session);
    if (!req.session.userId) return null;
    const user = await em.findOne(User, { id: req.session.userId });
    return user;
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() { em }: MyContext
  ): Promise<UserResponse> {
    try {
      if (options.username.length <= 3) {
        return {
          errors: [
            {
              field: "username",
              msg: "Username must be at least 4 characters",
            },
          ],
        };
      }

      if (options.password.length <= 3) {
        return {
          errors: [
            {
              field: "password",
              msg: "Password must be at least 4 characters",
            },
          ],
        };
      }

      const hash = await argon2.hash(options.password);
      const user = em.create(User, {
        username: options.username,
        password: hash,
      });
      await em.persistAndFlush(user);
      return { user };
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return {
          errors: [{ field: "username", msg: "Username is already taken" }],
        };
      }
      return {
        errors: [{ field: "None", msg: "Internal server error" }],
      };
    }
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    try {
      const user = await em.findOne(User, { username: options.username });
      if (!user) {
        return {
          errors: [{ msg: "Username doesn't exist", field: "username" }],
        };
      }
      if (await argon2.verify(user.password, options.password)) {
        req.session.userId = user.id;
        return { user };
      }
      return {
        errors: [{ msg: "Invalid password", field: "password" }],
      };
    } catch (err) {
      return {
        errors: [{ field: "None", msg: "Internal server error" }],
      };
    }
  }
}
