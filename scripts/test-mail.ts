import fs from 'fs';
import path from 'path';

const nodemailer = require('nodemailer');

type EnvMap = Record<string, string>;

type CliArgs = {
  to?: string;
  subject?: string;
};

const ROOT_DIR = path.resolve(__dirname, '..');

const loadEnvFile = (filePath: string, target: EnvMap) => {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      return;
    }

    const eq = trimmed.indexOf('=');
    if (eq === -1) {
      return;
    }

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();

    if (!key || Object.prototype.hasOwnProperty.call(target, key)) {
      return;
    }

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    target[key] = value;
  });
};

const loadEnv = () => {
  const envFromFiles: EnvMap = {};
  loadEnvFile(path.join(ROOT_DIR, '.env.local'), envFromFiles);
  loadEnvFile(path.join(ROOT_DIR, '.env'), envFromFiles);

  Object.entries(envFromFiles).forEach(([key, value]) => {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  });
};

const parseArgs = (): CliArgs => {
  const args = process.argv.slice(2);
  const parsed: CliArgs = {};

  for (const arg of args) {
    if (arg.startsWith('--to=')) {
      parsed.to = arg.slice('--to='.length).trim();
      continue;
    }
    if (arg.startsWith('--subject=')) {
      parsed.subject = arg.slice('--subject='.length).trim();
    }
  }

  return parsed;
};

const main = async () => {
  loadEnv();
  const args = parseArgs();

  const host = process.env.MAIL_HOST || 'localhost';
  const port = parseInt(process.env.MAIL_PORT || '587', 10);
  const user = process.env.MAIL_USER || '';
  const pass = process.env.MAIL_PASS || '';
  const from = process.env.MAIL_FROM || 'noreply@weightlossclinic.com';
  const to = args.to || process.env.MAIL_TEST_TO || user;

  if (!to) {
    console.error('Missing recipient. Provide --to=someone@example.com');
    process.exit(1);
  }

  const subject =
    args.subject || 'Weight Loss Clinic SMTP test (credentials email)';

  const transport: Record<string, unknown> = {
    host,
    port,
    secure: port === 465,
  };

  if (user && pass) {
    transport['auth'] = { user, pass };
  }

  const transporter = nodemailer.createTransport(transport);

  try {
    await transporter.verify();
    console.log('SMTP verify OK');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('SMTP verify failed:', message);
    process.exit(1);
  }

  try {
    const info = await transporter.sendMail({
      to,
      from,
      subject,
      text: [
        'This is a test email from Weight Loss Clinic.',
        'If you received this, SMTP credentials are working.',
      ].join('\n'),
    });

    console.log('Mail sent:', info?.messageId ?? 'OK');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Send failed:', message);
    process.exit(1);
  }
};

void main();
