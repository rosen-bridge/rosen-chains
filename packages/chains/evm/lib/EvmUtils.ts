import { transferABI } from './constants';
import { PaymentOrder, SinglePayment } from '@rosen-chains/abstract-chain';
import { Contract } from 'ethers';

class EvmUtils {
  /**
   * extracts every SinglePayment from PaymentOrder
   * @param orders the aggregated PaymentOrder
   * @returns the splitted PaymentOrder
   */
  static splitPaymentOrders = (orders: PaymentOrder): PaymentOrder => {
    return orders.reduce<PaymentOrder>(
      (sum: PaymentOrder, order: SinglePayment) => {
        if (order.assets.nativeToken != BigInt(0)) {
          sum.push({
            address: order.address,
            assets: {
              nativeToken: order.assets.nativeToken,
              tokens: [],
            },
            extra: order.extra,
          });
        }
        order.assets.tokens.forEach((token) => {
          sum.push({
            address: order.address,
            assets: {
              nativeToken: BigInt(0),
              tokens: [token],
            },
            extra: order.extra,
          });
        });
        return sum;
      },
      []
    );
  };

  /**
   * generates calldata to execute `transfer` function in the given contract
   * @param contractAddress the address of the contract
   * @param to the recipient's address
   * @param amount the amount to be transfered
   * @returns calldata in hex string with the initial '0x'
   */
  static generateTransferCallData = (
    contractAddress: string,
    to: string,
    amount: bigint
  ): string => {
    const contract = new Contract(contractAddress, transferABI, null);
    return contract.interface.encodeFunctionData('transfer', [to, amount]);
  };
}

export default EvmUtils;
