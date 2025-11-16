"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const generateCertificate_1 = require("./src/utils/generateCertificate");
const generateCertificate_2 = require("./src/utils/generateCertificate");
(async () => {
    try {
        const buffer = await (0, generateCertificate_2.generateCertificate)({
            name: "أحمد محمد",
            rank: "Silver",
        });
        await (0, generateCertificate_1.sendCertificateEmail)("osamaabushama1@gmail.com", "أحمد محمد", "Silver", buffer);
        console.log("تم الإرسال!");
    }
    catch (err) {
        console.error("فشل:", err.message);
    }
})();
