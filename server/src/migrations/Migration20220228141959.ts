import { Migration } from '@mikro-orm/migrations';

export class Migration20220228141959 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table `user` add `email` varchar(128) not null;');
    this.addSql('alter table `user` add unique `user_email_unique`(`email`);');
  }

  async down(): Promise<void> {
    this.addSql('alter table `user` drop index `user_email_unique`;');
    this.addSql('alter table `user` drop `email`;');
  }

}
