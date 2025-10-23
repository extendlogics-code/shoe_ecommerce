import { appConfig } from "../config";

type MailOptions = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{ filename: string; path: string }>;
};

type TransporterLike = {
  sendMail: (mail: MailOptions & { from?: string }) => Promise<unknown>;
};

type NodemailerModule = {
  createTransport: (options: {
    host?: string;
    port: number;
    secure: boolean;
    auth?: {
      user?: string;
      pass?: string;
    };
  }) => TransporterLike;
};

let transporter: TransporterLike | null = null;
let nodemailerModule: NodemailerModule | null = null;

const ensureNodemailer = async (): Promise<NodemailerModule | null> => {
  if (nodemailerModule) {
    return nodemailerModule;
  }

  try {
    const module = (await import("nodemailer")) as
      | NodemailerModule
      | { default: NodemailerModule };
    nodemailerModule = "default" in module ? module.default : module;
  } catch (error) {
    console.error(
      "Email transport requested but nodemailer is not available. Install nodemailer to enable email sending."
    );
    nodemailerModule = null;
  }

  return nodemailerModule;
};

const getTransporter = async (): Promise<Transporter | null> => {
  if (!appConfig.mail.enabled) {
    return null;
  }

  if (!transporter) {
    const module = await ensureNodemailer();
    if (!module) {
      return null;
    }

    transporter = module.createTransport({
      host: appConfig.mail.host ?? undefined,
      port: appConfig.mail.port,
      secure: appConfig.mail.secure,
      auth: {
        user: appConfig.mail.user ?? undefined,
        pass: appConfig.mail.pass ?? undefined
      }
    });
  }

  return transporter;
};

export const sendMail = async (options: MailOptions) => {
  const transport = await getTransporter();
  if (!transport) {
    console.warn("Email disabled: skipping mail send", {
      to: options.to,
      subject: options.subject
    });
    return;
  }

  await transport.sendMail({
    from: appConfig.mail.from,
    ...options
  });
};
