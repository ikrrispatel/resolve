import type {NextConfig} from 'next';
import {fileURLToPath} from 'node:url';
const config:NextConfig={compress:false,turbopack:{root:fileURLToPath(new URL('../..',import.meta.url))},async rewrites(){return [{source:'/api/:path*',destination:'http://127.0.0.1:4310/api/:path*'}]}};
export default config;
