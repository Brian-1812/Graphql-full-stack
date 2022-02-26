import { MikroORM } from "@mikro-orm/core";
import { TsMorphMetadataProvider } from "@mikro-orm/reflection";
import { __prod__ } from "./constants";

export default {
  entities: ["./dist/entities"],
  entitiesTs: ["./src/entities"],
  metadataProvider: TsMorphMetadataProvider,
  type: "mysql",
  dbName: "lireddit",
  user: "root",
  password: "root12345",
  debug: !__prod__,
  migrations: {
    path: "dist/migrations",
    pathTs: "src/migrations",
    glob: "!(*.d).{js,ts}",
  },
} as Parameters<typeof MikroORM.init>[0];
