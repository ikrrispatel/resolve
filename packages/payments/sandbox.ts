import {generateKeyPairSigner} from '@solana/kit';
export const SANDBOX_RPC='https://402.surfnet.dev:8899';
// Hosted Surfpool fork uses mainnet's CAIP id. All sandbox signers use this RPC only.
export const SVM_NETWORK='solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp' as const;
export const USDC='EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
export async function rpc(url:string,method:string,params:unknown[]){const response=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),signal:AbortSignal.timeout(15000)});const body=await response.json();if(body.error)throw Error('RPC_ERROR');return body.result;}
export async function sandboxSigner(){const signer=await generateKeyPairSigner();await rpc(SANDBOX_RPC,'surfnet_setAccount',[signer.address,{lamports:100000000000,data:'',executable:false,owner:'11111111111111111111111111111111'}]);await rpc(SANDBOX_RPC,'surfnet_setTokenAccount',[signer.address,USDC,{amount:1000000000},'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA']);return signer;}
