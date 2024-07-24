import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDir = path.join(__dirname, 'node_modules', 'tiny-secp256k1', 'lib');
const targetDir = path.join(__dirname, '.next', 'server');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

fs.copyFileSync(
  path.join(sourceDir, 'secp256k1.wasm'),
  path.join(targetDir, 'secp256k1.wasm')
);

console.log('WASM file copied successfully');
