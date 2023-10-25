import * as url from 'url';
import * as path from 'path';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

export const DataDirectory = path.join(__dirname, "../../../data");
