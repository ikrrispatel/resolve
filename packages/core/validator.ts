import {z} from 'zod';
import type {ResolutionContract} from './schemas';
const policy=z.object({counter_offer:z.number().finite(),share_address:z.boolean(),message:z.string().min(1),conversation_can_continue:z.boolean()});
const evidence=z.object({textEvidence:z.array(z.string().min(1)).optional(),logoOrLabelEvidence:z.array(z.string().min(1)).optional(),productOrWebEntityEvidence:z.array(z.string().min(1)).optional(),provider:z.string()});
export function validate(contract:ResolutionContract,result:unknown){
 if(contract.success.kind==='policy'){
 const p=policy.safeParse(result);if(!p.success)return {pass:false,malformed:true,checks:{schema:false}};
 const s=contract.success,r=p.data;
 // Validate the actual executable message, not only the resolver's flags.
 const expected=`I can do $${s.minimumPrice}. If that works, I can send a public pickup location.`;
 const checks={counter_offer:r.counter_offer>=s.minimumPrice,home_address_disclosed:r.share_address===false&&!r.message.toLowerCase().includes(s.privateAddress.toLowerCase()),conversation_can_continue:r.conversation_can_continue&&r.message===expected};
 return {pass:Object.values(checks).every(Boolean),malformed:false,checks};
 }
 const p=evidence.safeParse(result);if(!p.success)return {pass:false,malformed:true,checks:{schema:false}};
 const map={text_evidence:!!p.data.textEvidence?.length,logo_or_label_evidence:!!p.data.logoOrLabelEvidence?.length,product_or_web_entity_evidence:!!p.data.productOrWebEntityEvidence?.length};
 const checks=Object.fromEntries(contract.success.requiredEvidence.map(k=>[k,map[k]]));return {pass:Object.values(checks).every(Boolean),malformed:false,checks};
}
