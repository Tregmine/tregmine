import Mailgun = require("mailgun-js");
import Pug = require("pug");
const {render} = Pug;
import Markdown from "./Markdown";
import { Config } from "../Config";
import { RestError } from "../http/util";
import { ERROR_CODES, FRONTEND_URL } from "../Constants";
import path = require("path");
import inlineCSS = require("inline-css");
import { User } from "oauth2-server";

class _MailDispatcher {
    mailgun = Config.mailgun ? new Mailgun(Config.mailgun) : null;
    compiledTemplate = Pug.compileFile(path.resolve(__dirname, "..", "..", "files", "templates", "email.pug"));

    /**
     * Send an email to the specified address.
     * @param email The recipient of the email.
     * @param subject The subject of the email.
     * @param body The body of the email as markdown
     * @param plainTextBody The body of the email, if rendered as plain text by the mail client.
     * @returns The Mailgun ID of the sent message.
     */
    async sendEmail(email: string, subject: string, body: string, plainTextBody?: string): Promise<string> {
        if (!this.mailgun) throw new RestError(ERROR_CODES.INTERNAL_ERROR);

        const rendered = await this.renderEmail(subject, body, plainTextBody);
        const response = await this.mailgun.messages().send({
            from: `Dynastic Accounts <no-reply@${Config.mailgun!.domain}>`,
            to: email,
            subject: subject,
            html: rendered.html,
            text: rendered.plain
        });
        return response.id;
    }

    /**
     * Send an email to the specified address with user information in the body.
     * @param user The user this email is being sent to.
     * @param email The recipient of the email.
     * @param subject The subject of the email.
     * @param body The body of the email as markdown
     * @param plainTextBody The body of the email, if rendered as plain text by the mail client.
     * @param reason Fits in the sentence "This email was sent because _."
     * @returns The Mailgun ID of the sent message.
     */
    sendUserEmail(user: User, email: string, subject: string, body: string, plainTextBody?: string, reason: string = "this email address is linked to a Dynastic Account"): Promise<string> {
        const greeting = `Hi ${user.name},`;
        const footer = `This email was sent to ${email} because ${reason}.`;
        var plain = plainTextBody ? `${greeting}\n\n${plainTextBody}\n\n${footer}` : undefined;
        var body = `# ${greeting}\n\n${body}\n\n\`\`\`small-muted\n${footer}\`\`\``;
        return this.sendEmail(email, subject, body, plain)
    }

    /**
     * Render an email provided its body and subject, returning the HTML and plain text versions of it.
     * @param subject The subject of the email.
     * @param body The body of the email as markdown
     * @param plainTextBody The body of the email, if rendered as plain text by the mail client.
     * @returns The Mailgun ID of the sent message.
     */
    async renderEmail(subject: string, body: string, plainTextBody?: string): Promise<{html: string, plain: string}> {
        const rendered = await Markdown(body);
        const plain = plainTextBody || await Markdown(body, true);
        const html = this.compiledTemplate({ subject, rendered, plain });
        return {
            plain,
            html: await inlineCSS(html, {url: FRONTEND_URL, applyLinkTags: false, removeLinkTags: false})
        };
    }
}

export const MailDispatcher = new _MailDispatcher()