import { Injectable } from '@nestjs/common';
import { TransactionService } from '@src/database/transaction.service';
import { getAuthRepository } from '@src/module/auth/auth.repository';

@Injectable()
export class RepositoryProvider {
  constructor(private transaction: TransactionService) {}
  get AuthRepository() {
    return getAuthRepository(this.transaction);
  }
}
