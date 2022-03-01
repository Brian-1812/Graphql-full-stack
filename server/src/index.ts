import "reflect-metadata";
import http from "http";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import {
  ApolloServerPluginDrainHttpServer,
  ApolloServerPluginLandingPageGraphQLPlayground,
} from "apollo-server-core";
import { buildSchema } from "type-graphql";
import { createConnection } from "typeorm";
import Redis from "ioredis";
import session from "express-session";
import connectRedis from "connect-redis";
import cors from "cors";
import { PostResolver } from "./resolvers/Post";
import { UserResolver } from "./resolvers/User";
import { COOKIE_NAME, __prod__ } from "./constants";
import { Post } from "./entities/Post";
import { User } from "./entities/User";

const main = async () => {
  //Orm db connect
  await createConnection({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "root12345",
    database: "lireddit2",
    entities: [Post, User],
    synchronize: true,
    logging: true,
  });
  // Express server
  const app = express();
  const httpServer = http.createServer(app);

  // Redis client connect
  const RedisStore = connectRedis(session);
  const redis = new Redis();

  // configuring cors
  var corsOptions = {
    origin: "http://localhost:3000",
    credentials: true,
    // optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
  };
  app.use(cors(corsOptions));

  // Session with Redis
  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({ client: redis, disableTouch: true }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7,
        secure: false,
        httpOnly: true,
        sameSite: "lax",
        // path: "/graphql",
      },
      saveUninitialized: false,
      secret: "a;kdljfoiwenfadlkfnmasd",
      resave: false,
    })
  );

  // Apollo Graphql server
  const server = new ApolloServer({
    schema: await buildSchema({
      resolvers: [PostResolver, UserResolver],
      validate: false,
    }),
    context: ({ req, res }) => {
      return { req, res, redis };
    },
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      ApolloServerPluginLandingPageGraphQLPlayground(),
    ],
  });

  await server.start();

  server.applyMiddleware({ app, path: "/graphql", cors: false });

  httpServer.listen(4000, () => {
    console.log(
      `🚀 Server ready at http://localhost:4000${server.graphqlPath}`
    );
  });
};

main().catch((err) => console.error(err));
