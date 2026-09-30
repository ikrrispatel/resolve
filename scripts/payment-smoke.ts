import {createServer} from '../apps/api/src/server';
import {scenario} from '../packages/core/scenarios';
import {sandboxSigner,SANDBOX_RPC} from '../packages/payments/sandbox';
import {X402FoundationAdapter} from '../packages/payments/x402Adapter';
import {randomUUID} from 'node:crypto';
const {server,origin}=await createServer(4316);
try {const url=origin+'/paid/policy';const unpaid=await fetch(url,{method:'POST'});console.log('UNPAID_HTTP',unpaid.status);const adapter=new X402FoundationAdapter(await sandboxSigner(),SANDBOX_RPC,new Set([origin]));const paid=await adapter.pay({attemptId:randomUUID(),url,method:'POST',body:{contract:scenario('policy').contract},maxAmountUsd:.001,signal:AbortSignal.timeout(45000),onEvent:(t,d)=>console.log(t,d)});console.log(JSON.stringify(paid,null,2));if(unpaid.status!==402||paid.status!=='SETTLED'||paid.responseStatus!==200)process.exitCode=1;}finally{server.close();}
