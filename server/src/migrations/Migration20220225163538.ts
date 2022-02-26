import { Migration } from '@mikro-orm/migrations';

export class Migration20220225163538 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table `user` modify `username` varchar(128) not null;');
    this.addSql('alter table `user` add unique `user_username_unique`(`username`);');
  }

  async down(): Promise<void> {
    this.addSql('alter table `user` modify `username` text not null;');
    this.addSql('alter table `user` drop index `user_username_unique`;');
  }

}
