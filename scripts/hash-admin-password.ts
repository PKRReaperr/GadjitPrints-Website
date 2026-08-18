import { hashPassword } from '../src/server/auth.js';

if (!process.stdin.isTTY) throw new Error('Run this script in an interactive terminal. Do not pipe passwords.');
process.stdout.write('Administrator password (input hidden by terminal): ');
process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.setEncoding('utf8');
let password = '';
for await (const key of process.stdin) {
  if (key === '\r' || key === '\n') break;
  if (key === '\u0003') process.exit(130);
  if (key === '\u007f' || key === '\b') password = password.slice(0, -1);
  else password += key;
}
process.stdin.setRawMode(false);
process.stdin.pause();
process.stdout.write('\n');
if (password.length < 12)
  throw new Error('Use at least 12 characters. A password manager-generated passphrase is recommended.');
const result = await hashPassword(password);
password = '';
console.log('Copy this Argon2id hash into ADMIN_BOOTSTRAP_PASSWORD_HASH in Vercel Preview only:');
console.log(result);
