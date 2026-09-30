import type {ResolutionContract,ResolverManifest} from '../core/schemas';
export type ResolverResult=Record<string,unknown>;
export interface Resolver {
 manifest():ResolverManifest;
 resolve(contract:ResolutionContract):Promise<ResolverResult>;
}
