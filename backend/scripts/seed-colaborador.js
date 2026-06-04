/**
 * Seed script: create full PROVIDER account for luizdevph@gmail.com
 * Run: node scripts/seed-colaborador.js
 */

const admin  = require("firebase-admin");
const { PrismaClient } = require("@prisma/client");

const EMAIL        = "luizdevph@gmail.com";
const PASSWORD     = "29303132Lui,";
const DISPLAY_NAME = "Luiz Dev";

const FIREBASE_PROJECT_ID    = "focusme-c34f9";
const FIREBASE_CLIENT_EMAIL  = "firebase-adminsdk-fbsvc@focusme-c34f9.iam.gserviceaccount.com";
const FIREBASE_PRIVATE_KEY   = `-----BEGIN PRIVATE KEY-----
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

const DATABASE_URL = "postgresql://neondb_owner:npg_hXY8mkMU5ZRi@ep-old-silence-aca1ol22-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

// ── Init ─────────────────────────────────────────────────────────────────────

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      privateKey:  FIREBASE_PRIVATE_KEY,
    }),
  });
}

process.env.DATABASE_URL = DATABASE_URL;
const prisma = new PrismaClient();

// ── Helpers ──────────────────────────────────────────────────────────────────

function log(step, msg) { console.log(`[PASSO ${step}] ${msg}`); }
function ok(step, msg)  { console.log(`[PASSO ${step}] ✅ ${msg}`); }
function warn(step, msg){ console.log(`[PASSO ${step}] ⚠️  ${msg}`); }

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n=== SEED COLABORADOR — luizdevph@gmail.com ===\n");

  // ── PASSO 1: Firebase Auth ───────────────────────────────────────────────
  log(1, "Firebase Auth...");
  let firebaseUid;
  try {
    const existing = await admin.auth().getUserByEmail(EMAIL);
    firebaseUid = existing.uid;
    warn(1, `Usuário já existe: uid=${firebaseUid}`);
    // Update password and displayName to ensure they match
    await admin.auth().updateUser(firebaseUid, {
      password:    PASSWORD,
      displayName: DISPLAY_NAME,
    });
    ok(1, `Senha/nome atualizados. uid=${firebaseUid}`);
  } catch (e) {
    if (e.code === "auth/user-not-found") {
      const created = await admin.auth().createUser({
        email:       EMAIL,
        password:    PASSWORD,
        displayName: DISPLAY_NAME,
        emailVerified: true,
      });
      firebaseUid = created.uid;
      ok(1, `Usuário criado. uid=${firebaseUid}`);
    } else {
      throw e;
    }
  }

  // ── PASSO 2: User no banco ───────────────────────────────────────────────
  log(2, "Usuário no banco PostgreSQL...");
  let user = await prisma.user.findFirst({ where: { email: EMAIL } });
  if (user) {
    user = await prisma.user.update({
      where: { id: user.id },
      data:  { role: "PROVIDER", firebaseUid, name: DISPLAY_NAME },
    });
    ok(2, `User atualizado. id=${user.id}, role=${user.role}`);
  } else {
    user = await prisma.user.create({
      data: { email: EMAIL, name: DISPLAY_NAME, firebaseUid, role: "PROVIDER" },
    });
    ok(2, `User criado. id=${user.id}`);
  }

  // ── PASSO 3: Wallet ──────────────────────────────────────────────────────
  log(3, "Wallet...");
  let wallet = await prisma.wallet.findFirst({ where: { ownerId: user.id } });
  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: { ownerId: user.id, balance: 0 },
    });
    ok(3, `Wallet criada. id=${wallet.id}`);
  } else {
    ok(3, `Wallet já existe. id=${wallet.id}, balance=${wallet.balance}`);
  }

  // ── PASSO 4: Provider ────────────────────────────────────────────────────
  log(4, "Provider...");
  let provider = await prisma.provider.findFirst({
    where: { userId: user.id, deletedAt: null },
  });
  if (!provider) {
    provider = await prisma.provider.create({
      data: {
        userId:       user.id,
        categories:   ["Tecnologia", "Consultoria"],
        isVerified:   true,
        rating:       0,
        totalReviews: 0,
      },
    });
    // bio lives on User, update it there
    await prisma.user.update({
      where: { id: user.id },
      data:  { bio: "Colaborador de teste para homologação do TwoPlayers." },
    });
    ok(4, `Provider criado. id=${provider.id}`);
  } else {
    await prisma.provider.update({
      where: { id: provider.id },
      data:  { categories: ["Tecnologia", "Consultoria"], isVerified: true },
    });
    await prisma.user.update({
      where: { id: user.id },
      data:  { bio: "Colaborador de teste para homologação do TwoPlayers." },
    });
    ok(4, `Provider já existe. id=${provider.id}`);
  }

  // ── PASSO 5: Serviço ─────────────────────────────────────────────────────
  log(5, "Serviço de teste...");
  let service = await prisma.service.findFirst({
    where: { providerId: provider.id, title: "Mentoria de Teste", deletedAt: null },
  });
  if (!service) {
    service = await prisma.service.create({
      data: {
        providerId:  provider.id,
        title:       "Mentoria de Teste",
        description: "Atendimento de teste para validar agendamento, reunião e finalização.",
        price:       5000,
        duration:    60,
        isActive:    true,
      },
    });
    ok(5, `Serviço criado. id=${service.id}, price=${service.price} centavos`);
  } else {
    await prisma.service.update({
      where: { id: service.id },
      data:  { price: 5000, duration: 60, isActive: true },
    });
    ok(5, `Serviço já existe. id=${service.id}`);
  }

  // ── PASSO 6: Disponibilidade (Seg-Sex 08:00-18:00) ──────────────────────
  log(6, "Disponibilidade...");
  // Delete existing rules for this provider and recreate clean
  await prisma.providerAvailability.deleteMany({
    where: { providerId: provider.id },
  });
  const weekdays = [1, 2, 3, 4, 5]; // Monday=1 to Friday=5
  for (const weekday of weekdays) {
    await prisma.providerAvailability.create({
      data: { providerId: provider.id, weekday, startTime: "08:00", endTime: "18:00" },
    });
  }
  ok(6, "Disponibilidade criada: Seg-Sex 08:00-18:00");

  // ── PASSO 7: Validar disponibilidade e provider ──────────────────────────
  log(7, "Validando registros no banco...");
  const avail = await prisma.providerAvailability.findMany({
    where: { providerId: provider.id },
  });
  ok(7, `${avail.length} regras de disponibilidade encontradas.`);

  const fullProvider = await prisma.provider.findFirst({
    where:   { id: provider.id },
    include: { user: true, services: { where: { deletedAt: null } }, availability: true },
  });
  ok(7, `Provider completo — serviços: ${fullProvider.services.length}, disponibilidade: ${fullProvider.availability.length}`);

  // ── Relatório final ──────────────────────────────────────────────────────
  console.log("\n========== RELATÓRIO FINAL ==========");
  console.log(`1. Firebase UID:    ${firebaseUid}`);
  console.log(`2. User ID:         ${user.id}`);
  console.log(`3. Provider ID:     ${provider.id}`);
  console.log(`4. Wallet ID:       ${wallet.id}`);
  console.log(`5. Service ID:      ${service.id}`);
  console.log(`6. Disponibilidade: sim (${avail.length} regras)`);
  console.log(`7. Login frontend:  pendente (validar manualmente)`);
  console.log(`8. URL painel:      http://localhost:3000/colaborador/${user.id}/perfil`);
  console.log(`9. URL perfil pub:  http://localhost:3000/providers/${provider.id}`);
  console.log("=====================================\n");
}

main()
  .catch(e => { console.error("ERRO:", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
