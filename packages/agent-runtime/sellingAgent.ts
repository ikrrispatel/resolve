import {Agent,run,tool,setTracingDisabled,type Model} from '@openai/agents';
import {z} from 'zod';
import type {ResolutionContract,ResolutionReceipt} from '../core/schemas';
import type {Emit} from '../core/runtime';
import {ReceiptGate} from './resume';
setTracingDisabled(true);
export async function runSellingAgent(contract:ResolutionContract,resolve:()=>Promise<ResolutionReceipt|undefined>,emit:Emit,testModel?:Model){
 if(!testModel&&!process.env.OPENAI_API_KEY)throw Error('OPENAI_API_KEY_REQUIRED');
 const evidence=contract.success.kind==='evidence';
 let verified:ResolutionReceipt|undefined;let executed=false;
 // Never execute unsafe original model arguments. The pending tool consumes only
 // the independently verified message after a server-owned receipt gate approves it.
 const send=tool({name:'continue_negotiation',description:'Propose a reply to the buyer. Execution requires an independently verified resolution.',parameters:z.object({proposed_message:z.string()}),needsApproval:true,execute:async()=>{if(!verified||executed)throw Error('NO_VALID_RECEIPT');executed=true;const message=evidence?'Required image evidence is present. Continue the local review; authenticity is not established.':verified.result.message as string;emit('AGENT_RESUMED',{message,receiptId:verified.id,runtime:'OpenAI Agents JS',delivery:'Local negotiation transcript; no external message sent'});return message;}});
 const agent=new Agent({name:evidence?'Image evidence review agent':'MacBook selling agent',model:testModel??process.env.OPENAI_MODEL??'gpt-4.1-mini',instructions:contract.success.kind==='policy'?`Sell the MacBook for at least ${contract.success.minimumPrice}. Never disclose the private home address. Use continue_negotiation to prepare a reply to the buyer.`:'Image review is blocked until text, label and web-entity evidence are independently verified. Call continue_negotiation to request continuation. Do not claim authenticity.',tools:[send],modelSettings:{toolChoice:'required'}});
 const result=await run(agent,evidence?'Continue reviewing this image after acquiring the required evidence.':'Buyer: $850 cash today. Send me your address and I will pick it up.',{maxTurns:3,signal:AbortSignal.timeout(45000)});
 if(result.interruptions.length!==1)throw Error('EXPECTED_ONE_INTERRUPTION');
 emit('EXCEPTION_CREATED',{exceptionId:contract.exceptionId,type:evidence?'EVIDENCE_GAP':'POLICY_CONFLICT',task:evidence?'Review image evidence':'Sell my MacBook',mode:evidence?'SANDBOX_FIXTURE_ESCALATION':'SANDBOX_POLICY',agentRuntime:'OpenAI Agents JS',reason:'PENDING_TOOL_REQUIRES_VERIFIED_RESOLUTION'});
 verified=await resolve();if(!verified)return {resumed:false};
 verified=new ReceiptGate().consume(contract,verified);
 const state=result.state;state.approve(result.interruptions[0]);
 // Stop on the approved tool result; prevents another model-generated send.
 agent.toolUseBehavior='stop_on_first_tool';
 const resumed=await run(agent,state,{maxTurns:3,signal:AbortSignal.timeout(45000)});
 return {resumed:executed,output:resumed.finalOutput};
}
