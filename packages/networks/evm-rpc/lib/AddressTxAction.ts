import { AbstractLogger, DummyLogger } from '@rosen-bridge/abstract-logger';
import { AddressTxsEntity } from '@rosen-bridge/evm-address-tx-extractor';
import { DataSource, Repository } from 'typeorm';

class AddressTxAction {
  private readonly repository: Repository<AddressTxsEntity>;
  readonly logger: AbstractLogger;

  constructor(dataSource: DataSource, logger?: AbstractLogger) {
    this.repository = dataSource.getRepository(AddressTxsEntity);
    this.logger = logger ? logger : new DummyLogger();
  }

  /**
   * gets transaction by unsigned hash
   * @param unsignedHash
   * @returns
   */
  getTxByUnsignedHash = async (
    unsignedHash: string
  ): Promise<AddressTxsEntity | null> => {
    // TODO: we are not considering the extractor here.
    //  therefore we may have two transaction with same unsigned hash over two different evm networks
    //  which may result in malfunction
    const res = await this.repository.find({
      where: {
        unsignedHash,
      },
    });
    if (res.length === 0) {
      this.logger.debug(
        `No transaction is found with unsigned hash [${unsignedHash}]`
      );
      return null;
    } else if (res.length > 1) {
      this.logger.warn(
        `Found [${res.length}] transactions with unsigned hash [${unsignedHash}]. returning the first one...`
      );
    }
    return res[0];
  };
}

export default AddressTxAction;
