import * as path from 'path';
import * as fs from 'fs/promises';
import * as express from 'express';
import { Server } from 'http';
import config from '../config';
import { postProcessHtml } from './toolpadAppBuilder';
import { loadDom } from './liveProject';
import { getAppOutputFolder } from './localMode';
import { asyncHandler } from '../utils/http';

export interface CreateViteConfigParams {
  server?: Server;
  root: string;
  base: string;
  canvas: boolean;
}

export interface ToolpadAppHandlerParams {
  server: Server;
  root: string;
  base: string;
}

export async function createProdHandler({ root }: ToolpadAppHandlerParams) {
  const router = express.Router();

  router.use(express.static(getAppOutputFolder(root), { index: false }));

  router.use(
    asyncHandler(async (req, res) => {
      const dom = await loadDom();

      const htmlFilePath = path.resolve(getAppOutputFolder(root), './index.html');
      let html = await fs.readFile(htmlFilePath, { encoding: 'utf-8' });

      html = postProcessHtml(html, { config, dom });

      res.setHeader('Content-Type', 'text/html').status(200).end(html);
    }),
  );

  return router;
}