/**
 * Create Supabase Auth user via Management API SQL endpoint
 */
const https = require('https');

const TOKEN = 'sbp_00e6c10eadc1753240375046a839264bd0cf1fd1';
const REF = 'gzvymxcojrljkprkgoap';
const EMAIL = 'huiyou@mro-dev.xyz';
const PASSWORD = '123456';

const sql = `
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Check if user exists
  SELECT id INTO v_user_id FROM auth.users WHERE email = '${EMAIL}' LIMIT 1;

  IF v_user_id IS NULL THEN
    -- Create new user
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change,
      email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      '${EMAIL}',
      crypt('${PASSWORD}', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      now(), now(), '', '', '', ''
    )
    RETURNING id INTO v_user_id;
    RAISE NOTICE 'User created: %', v_user_id;
  ELSE
    -- Update existing user's password
    UPDATE auth.users SET
      encrypted_password = crypt('${PASSWORD}', gen_salt('bf')),
      email_confirmed_at = now(),
      updated_at = now()
    WHERE id = v_user_id;
    RAISE NOTICE 'User updated: %', v_user_id;
  END IF;
END $$;
`;

const data = JSON.stringify({ query: sql });

const req = https.request(
  {
    hostname: 'api.supabase.com',
    path: `/v1/projects/${REF}/database/query`,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
  },
  (res) => {
    let body = '';
    res.on('data', (d) => (body += d));
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      console.log('Response:', body);
      if (res.statusCode === 201 || res.statusCode === 200) {
        console.log('✅ User created/updated successfully!');
      } else {
        console.log('❌ Failed.');
      }
    });
  }
);
req.write(data);
req.end();
