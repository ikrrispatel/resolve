import {benchmarkSummary} from './terminal';
import {runBenchmark} from '../packages/benchmark/run';
import {mkdir,writeFile} from 'node:fs/promises';
const result=runBenchmark();await mkdir('outputs',{recursive:true});await writeFile('outputs/benchmark.json',JSON.stringify(result,null,2));benchmarkSummary(result);if(process.argv.includes('--verbose'))console.log(JSON.stringify(result,null,2));
