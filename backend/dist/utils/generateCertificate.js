"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendCertificateEmail = exports.generateCertificatePDF = exports.generateCertificate = void 0;
const canvas_1 = require("canvas");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const pdfkit_1 = __importDefault(require("pdfkit"));
// === 1. Register Fonts ===
const amsterdamFontPath = path_1.default.join(process.cwd(), "public", "templates", "fonts", "Amsterdam.ttf");
if (fs_1.default.existsSync(amsterdamFontPath)) {
    (0, canvas_1.registerFont)(amsterdamFontPath, { family: "Amsterdam" });
    console.log("Amsterdam font loaded successfully");
}
else {
    console.warn("Warning: Amsterdam.ttf not found → default font will be used");
}
const regularFontPath = path_1.default.join(process.cwd(), "public", "templates", "fonts", "PlayfairDisplay-Regular.ttf");
if (fs_1.default.existsSync(regularFontPath)) {
    (0, canvas_1.registerFont)(regularFontPath, { family: "Playfair Display Regular" });
    console.log("Playfair Display Regular loaded");
}
else {
    console.warn("Warning: PlayfairDisplay-Regular.ttf not found");
}
// === 3. Template Map ===
const templateMap = {
    Silver: ["silver.png", "silver.jpg"],
    Gold: ["gold.png", "gold.jpg"],
    Platinum: ["platinum.png", "platinum.jpg"],
};
const getTemplatePath = (rank) => {
    const basePath = path_1.default.join(process.cwd(), "public", "templates", "certificates");
    const files = templateMap[rank];
    for (const file of files) {
        const fullPath = path_1.default.join(basePath, file);
        if (fs_1.default.existsSync(fullPath))
            return fullPath;
    }
    throw new Error(`Template not found: public/templates/certificates/${files.join(" or ")}`);
};
// === 4. Format Date ===
const formatEnglishDate = (date) => {
    const d = date ? new Date(date) : new Date();
    return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
};
// === 5. Wrap Long Text (Bug Fixed) ===
const wrapText = (ctx, text, maxWidth, lineHeight) => {
    const words = text.split(" ");
    const lines = [];
    let currentLine = words[0] || "";
    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + " " + word).width;
        if (width < maxWidth) {
            currentLine += " " + word;
        }
        else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return { lines, height: lines.length * lineHeight };
};
// === 6. Format Name ===
const capitalizeName = (name) => {
    return name
        .trim()
        .toLowerCase()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
};
// === 7. Main Function ===
const generateCertificate = async ({ name, rank, date, }) => {
    try {
        const formattedName = capitalizeName(name);
        const templatePath = getTemplatePath(rank);
        const image = await (0, canvas_1.loadImage)(templatePath);
        const canvas = (0, canvas_1.createCanvas)(image.width, image.height);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0, image.width, image.height);
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const maxTextWidth = canvas.width * 0.8;
        const verticalOffset = 100;
        // === 1. Name in Amsterdam Font ===
        let nameFontSize = 120;
        ctx.font = `${nameFontSize}px 'Amsterdam', serif`;
        ctx.fillStyle = "#1a1a1a";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        while (ctx.measureText(formattedName).width > maxTextWidth &&
            nameFontSize > 70) {
            nameFontSize -= 5;
            ctx.font = `${nameFontSize}px 'Amsterdam', serif`;
        }
        ctx.save();
        ctx.setTransform(1, 0, -0.15, 1, centerX, centerY - 90 + verticalOffset);
        ctx.fillText(formattedName, 0, 0);
        ctx.restore();
        // === 2. Rank Description ===
        const description = `for outstanding dedication, creativity, and consistency throughout the ${rank} level of StreakUp challenge`;
        ctx.font = "32px 'Playfair Display Regular', serif";
        ctx.fillStyle = "#8B6F47";
        const { lines } = wrapText(ctx, description, maxTextWidth, 40);
        let descY = centerY + 110 + verticalOffset;
        lines.forEach((line) => {
            ctx.fillText(line, centerX, descY);
            descY += 40;
        });
        // === 3. Date ===
        ctx.font = "18px 'Playfair Display Regular', serif";
        ctx.textAlign = "left";
        ctx.fillStyle = "#666666";
        ctx.fillText(`Issued on: ${formatEnglishDate(date)}`, centerX - maxTextWidth / 2 + 20, descY + 100);
        return canvas.toBuffer("image/png");
    }
    catch (error) {
        console.error("Failed to generate certificate:", error.message);
        throw new Error(`Failed to generate certificate: ${error.message}`);
    }
};
exports.generateCertificate = generateCertificate;
const generateCertificatePDF = async (imageBuffer, userName, rank) => {
    return new Promise((resolve, reject) => {
        const doc = new pdfkit_1.default({
            size: "A4",
            margin: 0,
            layout: "landscape",
        });
        const chunks = [];
        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);
        doc.rect(0, 0, doc.page.width, doc.page.height).fill("#ffffff");
        const imgWidth = doc.page.width * 0.9;
        const imgHeight = doc.page.height * 0.9;
        const x = (doc.page.width - imgWidth) / 2;
        const y = (doc.page.height - imgHeight) / 2;
        doc.image(imageBuffer, x, y, { width: imgWidth, height: imgHeight });
        doc
            .fontSize(16)
            .fillColor("#666666")
            .text(`Generated on: ${new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        })}`, 50, doc.page.height - 50, { align: "center", width: doc.page.width - 100 });
        doc.end();
    });
};
exports.generateCertificatePDF = generateCertificatePDF;
const sendCertificateEmail = async (userEmail, userName, rank, certificateBuffer) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            throw new Error("EMAIL_USER or EMAIL_PASS not set in .env");
        }
        const transporter = nodemailer_1.default.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
        await transporter.verify();
        console.log("SMTP connection successful");
        const mailOptions = {
            from: `"StreakUp" <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject: `Congrats! Your ${rank} Certificate from StreakUp`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px; background: #f9f9ff;">
          <h1 style="color: #A333FF; text-align: center; margin-bottom: 10px;">Congratulations, ${userName}!</h1>
          <p style="font-size: 16px; line-height: 1.6; text-align: center; color: #333;">
            You've successfully reached the <strong style="color: #A333FF;">${rank}</strong> rank in StreakUp!
          </p>
          <p style="font-size: 16px; line-height: 1.6; text-align: center; color: #333;">
            Your dedication and consistency have paid off. Here's your official certificate — share it with pride!
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <img src="cid:certificate_preview" alt="Your Certificate" style="max-width: 100%; border-radius: 12px; box-shadow: 0 6px 16px rgba(0,0,0,0.1); border: 1px solid #eee;" />
          </div>

          <p style="font-size: 14px; color: #666; text-align: center; margin-top: 30px;">
            Keep up the great work and aim for the next rank!
          </p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #999; text-align: center;">
            Best regards,<br><strong>The StreakUp Team</strong>
          </p>
        </div>
      `,
            attachments: [
                {
                    filename: `${rank}_Certificate_${userName.replace(/\s+/g, "_")}.png`,
                    content: certificateBuffer,
                    cid: "certificate_preview",
                },
                {
                    filename: `${rank}_Certificate_${userName.replace(/\s+/g, "_")}.png`,
                    content: certificateBuffer,
                    cid: "certificate_download",
                },
            ],
        };
        await transporter.sendMail(mailOptions);
        console.log(`${rank} certificate sent successfully to ${userEmail}`);
    }
    catch (error) {
        console.error("Failed to send email:", error.message);
        throw new Error(`Failed to send certificate: ${error.message}`);
    }
};
exports.sendCertificateEmail = sendCertificateEmail;
