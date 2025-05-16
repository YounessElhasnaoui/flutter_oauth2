// temp_hash_client_secret.js
const bcrypt = require('bcrypt');
const plainClientSecret = '_aVeryStr0ng-and_R@ndom-S3cr3t-f0r-FluTt3r'; // Your chosen secret

async function hashSecret() {
  const salt = await bcrypt.genSalt(10); // Or your preferred salt rounds
  const hash = await bcrypt.hash(plainClientSecret, salt);
  console.log(`Plain Secret: ${plainClientSecret}`);
  console.log(`Hashed Secret: ${hash}`);
}

hashSecret();