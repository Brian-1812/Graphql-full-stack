import {
  Arg,
  Field,
  Ctx,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from "type-graphql";
import argon2 from "argon2";
import { MyContext } from "../types";
import { User } from "../entities/User";
import { COOKIE_NAME, FORGOT_PASSWORD_PREFIX } from "../constants";
import { UsernamePasswordInput } from "./UsernamePasswordInput";
import { validateRegister } from "../utils/validateRegister";
import { v4 } from "uuid";
import { sendEmail } from "../utils/sendEmail";

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

  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg("email") email: string,
    @Ctx() { em, redis }: MyContext
  ) {
    try {
      console.log("Email: ", email);
      const user = await em.findOne(User, { email });
      if (!user) {
        return true;
      }

      const token = v4();
      console.log("setting redis");
      await redis.set(FORGOT_PASSWORD_PREFIX + token, user.id);
      console.log("sending email");
      await sendEmail(
        email,
        `<a href="http://localhost:3000/reset-password/${token}">Reset your password</a>`
      );
      console.log("Returning");
      return true;
    } catch (err) {
      console.log(err);
      return true;
    }
  }

  @Mutation(() => UserResponse)
  async resetPassword(
    @Arg("token") token: string,
    @Arg("newPassword") newPassword: string,
    @Ctx() { em, redis, req }: MyContext
  ) {
    const key = FORGOT_PASSWORD_PREFIX + token;
    const id = await redis.get(key);
    if (!id) {
      return {
        errors: [
          {
            field: "token",
            msg: "Token expired",
          },
        ],
      };
    }

    const user = await em.findOne(User, { id: Number(id) });
    if (!user) {
      return {
        errors: [
          {
            field: "token",
            msg: "This user no longer exist",
          },
        ],
      };
    }
    if (newPassword.length < 4)
      return {
        errors: [
          {
            field: "newPassword",
            msg: "Password must be at least 4 characters!",
          },
        ],
      };
    user.password = await argon2.hash(newPassword);
    await em.persistAndFlush(user);
    await redis.del(key);
    req.session.userId = user.id;
    return { user };
  }
}
