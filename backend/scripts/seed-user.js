const admin = require("firebase-admin");
const { PrismaClient } = require("@prisma/client");

const FIREBASE_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDXL9n4tTAQChuI
iOjvECH61NtRC7sxxrAjHXXQCCKssNXtbgseeeUKEp1n2gETJv05FZfsUCKHDLs/
D38ZT4JVYowSavU4Qrl01bmRc2zm60TrGByfJI49OEWhZravoB3pT7Fec1oBdS4E
IWb83gNrbrtBJEb6WoRV8KIYnga8ODfFqvEJXInUXKQ6PHdRYFAkJRlfOVcqFFtd
jHaq6bRxuhA0yQk22ndX/RyC/bTti1cvScDUcl4aQUdJ5dGtkDMWlMC+pR3yfxim
OuJJgV3FJyJKpMwIssQ84biikmS4cn9Y3XF1T8R4GxjkrUJR7aJyKuSEtHC9RIMy
Ln7ao4c/AgMBAAECggEACakZS3DlWBYyeqSC28pJBdf5tjklNBMScN3vhK5ia1RP
b/OJX9qv4KewFcVHJRMsBrY+D5rglSWKLOBgn8QR1HMYv/IgHi174lxLkqJKJYSZ
OUcbPQqVsPcbKsE2VGSHOaRqEK5z2cez9o8bu4bc3aOnMagT4Hg6o4BESeY8sSug
muyymrvYH1fi/6JuXOPgCmO5dILevYEZLxvIruAkhpejX/2kZVjs49PZmnGF8WQ/
J9DxLXIC8ytkw89zSvUQPXxHP3Mj5WeSAOEjHKzaI79WSm5hcm+XoQPCS8ngvyYG
zaJO6ZQ2HeygIsvQk4YnJcSvqoH9DXRkcsrb3A8PmQKBgQD9KCQWVhKI/954gC2t
D2VtFeqMsp7YQtNYHHxOYGMYA/hBitv+TyN/DSXXe1mj+qUF6Of+8/UdCap3wlJS
W39fazOnpF3Qpc52iYBPfCDzGr/09V2FjkgBPxbqAFqz5PUQcsXfMHwLWP5XJLS5
I53ZSgDUXtjJRxL2jW8E6gVHBQKBgQDZmorGohd7AptyKMikn8pkzIEuG+U7iup3
FLVWXcUnTUnFggEgJ2C9cW0dd5Oa6znwPHi+7+QVKU4GJ2lkoBUboYT8lk2fogpt
NLszXnE+OJrkcGtTSNpWWbXYeGcmxjJ8umLW5QBMb0DX3amwp2IWHXoBLsfNTqKQ
6IlegRQgcwKBgGXhrLxMgYMfLmJie39lbdU797wN+r1gD3wrYp+MTPUSS+vcvXKY
WNm96dfRrZ6/tYAuXoeNmLzJ8g/mZYj9h8JX+17hWFwrDm9IIRpcA0qzHkOwJ6Yj
P7k4sbkU0WwKndGzzwxmj9VlSF67x/umaNVU4gaV8Tr33prZCq/4mo0dAoGAXe9j
xvmED1sBxZcrfj1ofnj1rvTl0P1X1839tenGyP+JQBSt7bZyAXWsd9L9yhuPKFDC
gxJFsIjjIK70xTaBxirEoNE1cxrdS2U/Bp7XXdfLrZ+GBS7m6e3SHT9ksA1REBzZ
vBChP12rbURIE3U+V3OkDkymfc9bSBjJ7BzmllcCgYBblexM51LEGg7LnrIpUtVm
0nVcxbnlRTrzPcRd1o/hw38kx4p/JCx2yVTovB1cXxAZX1ruNfICrX1oKtFmZ5BU
AdTrBODIFOwS3yj/PxdqL0WH61KzCTcdPbVKZEvLw+dThHUSJz/l6vvj9SII0VHv
POtDQ5RkmL2ZMQ2JCLwlmA==
-----END PRIVATE KEY-----
`;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   "focusme-c34f9",
      clientEmail: "firebase-adminsdk-fbsvc@focusme-c34f9.iam.gserviceaccount.com",
      privateKey:  FIREBASE_PRIVATE_KEY,
    }),
  });
}

process.env.DATABASE_URL = "postgresql://neondb_owner:npg_hXY8mkMU5ZRi@ep-old-silence-aca1ol22-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const prisma = new PrismaClient();

async function main() {
  const EMAIL = "usuario@twoplayers.test";
  const PASS  = "Teste123!";
  const NAME  = "Usuario Teste";

  let fbUid;
  try {
    const u = await admin.auth().getUserByEmail(EMAIL);
    fbUid = u.uid;
    await admin.auth().updateUser(fbUid, { password: PASS, displayName: NAME });
    console.log("Firebase: user existente, atualizado. uid=" + fbUid);
  } catch(e) {
    if (e.code === "auth/user-not-found") {
      const u = await admin.auth().createUser({ email: EMAIL, password: PASS, displayName: NAME, emailVerified: true });
      fbUid = u.uid;
      console.log("Firebase: user criado. uid=" + fbUid);
    } else throw e;
  }

  let user = await prisma.user.findFirst({ where: { email: EMAIL } });
  if (user) {
    user = await prisma.user.update({ where: { id: user.id }, data: { role: "USER", firebaseUid: fbUid, name: NAME } });
    console.log("DB: user atualizado. id=" + user.id);
  } else {
    user = await prisma.user.create({ data: { email: EMAIL, name: NAME, firebaseUid: fbUid, role: "USER" } });
    console.log("DB: user criado. id=" + user.id);
  }

  let wallet = await prisma.wallet.findFirst({ where: { ownerId: user.id } });
  if (!wallet) {
    wallet = await prisma.wallet.create({ data: { ownerId: user.id, balance: 0 } });
    console.log("Wallet criada. id=" + wallet.id);
  } else {
    console.log("Wallet já existe. id=" + wallet.id);
  }

  console.log("\nUSER_EMAIL=" + EMAIL);
  console.log("USER_PASSWORD=" + PASS);
  console.log("USER_ID=" + user.id);
  console.log("USER_FIREBASE_UID=" + fbUid);
}

main().catch(e => { console.error("ERRO:", e.message); process.exit(1); }).finally(() => prisma.$disconnect());
