import { Entity, PrimaryKey, Property } from "@mikro-orm/core";
import { Field, ObjectType } from "type-graphql";

@ObjectType()
@Entity()
export class User {
  @Field()
  @PrimaryKey()
  id!: number;

  @Field(() => String)
  @Property({ type: "date" })
  updatedAt? = new Date();

  @Field(() => String)
  @Property({ type: "date", onUpdate: () => new Date() })
  createdAt? = new Date();

  @Field()
  @Property({ length: 128, type: "varchar", unique: true })
  username!: string;

  @Field()
  @Property({ length: 128, type: "varchar", unique: true })
  email!: string;

  // @Field()
  @Property({ type: "text" })
  password!: string;
}
