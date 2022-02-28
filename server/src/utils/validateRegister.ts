import { UsernamePasswordInput } from "src/resolvers/UsernamePasswordInput";

export const validateRegister = (options: UsernamePasswordInput) => {
  if (options.username.length <= 3) {
    return [
      {
        field: "username",
        msg: "Username must be at least 4 characters",
      },
    ];
  }

  if (options.username.includes("@")) {
    return [
      {
        field: "username",
        msg: "Username must not contain '@'",
      },
    ];
  }

  if (!options.email.includes("@")) {
    return [
      {
        field: "email",
        msg: "Email must contain '@'!",
      },
    ];
  }

  if (options.password.length <= 3) {
    return [
      {
        field: "password",
        msg: "Password must be at least 4 characters",
      },
    ];
  }
  return null;
};
