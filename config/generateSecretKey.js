const crypto = require('crypto');
 
// Generate a random secret key
const generateSecretKey = () => {
  const secretKey = crypto.randomBytes(32).toString('hex');
  console.log('Generated Secret Key:', secretKey);
};
 
generateSecretKey();