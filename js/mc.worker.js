import { runMC } from './engine/montecarlo.js';

onmessage = (e) => postMessage(runMC(e.data.params));
