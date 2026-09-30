import type {NextConfig} from 'next';
import {fileURLToPath} from 'node:url';
const apiOrigin=process.env.RESOLVE_API_ORIGIN?.replace(/\/$/,'')||(process.env.NODE_ENV==='development'?'http://127.0.0.1:4310':undefined);
const config:NextConfig={compress:false,devIndicators:false,turbopack:{root:fileURLToPath(new URL('../..',import.meta.url))},async rewrites(){return apiOrigin?[{source:'/api/:path*',destination:`${apiOrigin}/api/:path*`}]:[];}};
export default config;
