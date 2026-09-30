import {z} from 'zod';
const money=z.number().finite().nonnegative().max(100).refine(n=>Math.abs(n*1e6-Math.round(n*1e6))<1e-6,'Use integer microdollars');
export const AgentExceptionSchema=z.object({id:z.string(),type:z.enum(['POLICY_CONFLICT','CAPABILITY_GAP','EVIDENCE_GAP','PERMISSION_GAP']),task:z.string(),context:z.record(z.string(),z.unknown()),valueAtRisk:z.number().optional(),maxResolutionSpend:money,deadlineMs:z.number().positive(),createdAt:z.string()});
export const SuccessContractSchema=z.discriminatedUnion('kind',[
 z.object({kind:z.literal('policy'),minimumPrice:z.number().positive(),privateAddress:z.string().min(1)}),
 z.object({kind:z.literal('evidence'),requiredEvidence:z.array(z.enum(['text_evidence','logo_or_label_evidence','product_or_web_entity_evidence'])).min(1)})]);
export const ResolutionContractSchema=z.object({id:z.string(),exceptionId:z.string(),requiredState:z.record(z.string(),z.unknown()),budget:z.object({maxTotal:money,maxAttempt:money}),deadlineMs:z.number().positive(),success:SuccessContractSchema});
export const ResolverManifestSchema=z.object({id:z.string(),name:z.string(),source:z.enum(['LOCAL','PAY_SH']),class:z.enum(['VERIFIER','SPECIALIST','HUMAN']),capabilities:z.array(z.string()),quotedPriceUsd:money,endpoint:z.string().url(),expectedLatencyMs:z.number().positive(),outputSchema:z.enum(['policy','evidence']),network:z.enum(['sandbox','mainnet']),prior:z.enum(['high','low'])});
export const ResolverResultSchema=z.record(z.string(),z.unknown());
export const ResolutionReceiptSchema=z.object({id:z.string(),contractId:z.string(),resolverId:z.string(),cost:money,paymentStatus:z.literal('SETTLED'),verificationStatus:z.literal('PASS'),result:ResolverResultSchema,createdAt:z.string(),transaction:z.string().min(32),network:z.enum(['sandbox','mainnet'])});
export const eventNames=['EXCEPTION_CREATED','CONTRACT_CREATED','RESOLVER_SELECTED','PAYMENT_REQUIRED','PAYMENT_AUTHORIZED','PAYMENT_SETTLED','RESULT_RECEIVED','VALIDATION_FAILED','ESCALATING','VALIDATION_PASSED','RECEIPT_ISSUED','AGENT_RESUMED','ABSTAINED'] as const;
export const ResolveEventSchema=z.object({id:z.string(),runId:z.string(),sequence:z.number().int(),type:z.enum(eventNames),at:z.string(),data:z.record(z.string(),z.unknown())});
export type AgentException=z.infer<typeof AgentExceptionSchema>;
export type ResolutionContract=z.infer<typeof ResolutionContractSchema>;
export type ResolverManifest=z.infer<typeof ResolverManifestSchema>;
export type ResolutionReceipt=z.infer<typeof ResolutionReceiptSchema>;
export type ResolveEvent=z.infer<typeof ResolveEventSchema>;
export type TerminalState='PASS'|'VALIDATION_FAIL'|'PAYMENT_FAIL'|'TIMEOUT'|'MALFORMED'|'BUDGET_DENIED';
export interface ResolverAttempt {id:string;resolverId:string;status:TerminalState;cost:number;reason:string;transaction?:string}
