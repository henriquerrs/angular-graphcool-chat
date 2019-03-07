import { InjectionToken } from '@angular/core';

const graphcoolId = 'cjskfnd3k27m901883l1ot3v1';

export interface GraphcoolConfig {
  simpleAPI: string;
  subscritionAPI: string;
  fileAPI: string;
  fileDownloadURL: string;
}

export const graphcoolConfig: GraphcoolConfig = {
  simpleAPI: `https://api.graph.cool/simple/v1${graphcoolId}`,
  subscritionAPI: `wss://subscriptions.graph.cool/v1${graphcoolId}`,
  fileAPI: `https://api.graph.cool/file/v1${graphcoolId}`,
  fileDownloadURL: `https://files.graph.cool/${graphcoolId}`
};

export const GRAPHCOOL_CONFIG = new InjectionToken<GraphcoolConfig>(
  'graphcool.config', {
    providedIn: 'root',
    factory: () => {
      return graphcoolConfig;
    }
  }
);
