const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'server', 'multi_tenant_dealers.json');

async function addAdmin() {
  const password = 'admin';
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  
  const adminDealer = {
    dealer_id: 'dlr_admin',
    email: 'admin@showroom.com',
    password: hashedPassword,
    dealership_name: 'Nexlify Master Admin',
    subscription_status: 'active',
    subscription_plan: 'enterprise',
    phone_number_id: '123456789',
    waba_id: '987654321',
    meta_access_token: '', // Needs to be encrypted if added via DB tool, but empty is fine for now
    updatedAt: new Date().toISOString()
  };

  // Check if already exists
  const existingIdx = data.dealers.findIndex(d => d.email === 'admin@showroom.com');
  if (existingIdx >= 0) {
    data.dealers[existingIdx] = adminDealer;
    console.log('Admin user updated.');
  } else {
    data.dealers.push(adminDealer);
    console.log('Admin user added.');
  }

  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

addAdmin();
