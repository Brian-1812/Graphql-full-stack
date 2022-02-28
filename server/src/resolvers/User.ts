import {
  Arg,
  Ctx,
  Field,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from "type-graphql";
import argon2 from "argon2";
import { MyContext } from "../types";
import { User } from "../entities/User";
import { COOKIE_NAME } from "../constants";
import { UsernamePasswordInput } from "./UsernamePasswordInput";
import { validateRegister } from "../utils/validateRegister";

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
      const errors = validateRegister(options);
      if (errors) {
        return { errors };
      }

      const hash = await argon2.hash(options.password);
      const user = em.create(User, {
        username: options.username,
        password: hash,
        email: options.email,
      });
      await em.persistAndFlush(user);
      return { user };
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return {
          errors: [
            { field: "username", msg: "Username or email is already taken" },
            { field: "email", msg: "Username or email is already taken" },
          ],
        };
      }
      return {
        errors: [{ field: "None", msg: "Internal server error" }],
      };
    }
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("emailOrUsername") emailOrUsername: string,
    @Arg("password") password: string,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    try {
      const user = await em.findOne(
        User,
        emailOrUsername.includes("@")
          ? { email: emailOrUsername }
          : { username: emailOrUsername }
      );
      console.log(user, "!User:", !user);
      if (!user) {
        return {
          errors: [
            {
              msg: "This username or email doesn't exist",
              field: "emailOrUsername",
            },
          ],
        };
      }
      if (await argon2.verify(user.password, password)) {
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

  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) => {
      req.session.destroy((err) => {
        res.clearCookie(COOKIE_NAME);
        if (err) {
          console.log(err);
          resolve(false);
          return;
        }
        resolve(true);
      });
    });
  }
}
