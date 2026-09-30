import type {ResolutionContract} from '../core/schemas';
export function policyResult(contract:ResolutionContract){if(contract.success.kind!=='policy')throw Error('WRONG_CONTRACT');return {counter_offer:contract.success.minimumPrice,share_address:false,conversation_can_continue:true,message:`I can do $${contract.success.minimumPrice}. If that works, I can send a public pickup location.`};}

import {policyManifest} from '../core/scenarios';
import type {Resolver} from './types';
export class PolicyVerifierResolver implements Resolver {
 constructor(private origin:string){}
 manifest(){return policyManifest(this.origin);}
 async resolve(contract:ResolutionContract){return policyResult(contract);}
}
