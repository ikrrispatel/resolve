import {ResolutionReceiptSchema,type ResolutionContract} from '../core/schemas';
import {validate} from '../core/validator';
export class ReceiptGate {
 private consumed=new Set<string>();
 consume(contract:ResolutionContract,input:unknown){const receipt=ResolutionReceiptSchema.parse(input);if(receipt.contractId!==contract.id||this.consumed.has(receipt.id)||!validate(contract,receipt.result).pass)throw Error('RECEIPT_REJECTED');this.consumed.add(receipt.id);return receipt;}
}
