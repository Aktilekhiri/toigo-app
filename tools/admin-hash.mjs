// Make the ADMIN_PASSWORD_HASH secret. The password itself is never stored anywhere.
// Usage:  node tools/admin-hash.mjs 'your long password'
//   then: npx wrangler secret put ADMIN_PASSWORD_HASH   (paste the printed line)
import { hashPassword } from "../lib/admin-auth.js";
const pw = process.argv[2];
if (!pw || pw.length < 10) { console.error("Give a password of at least 10 characters."); process.exit(1); }
console.log(await hashPassword(pw));
