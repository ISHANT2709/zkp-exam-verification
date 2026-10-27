
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const snarkjs = require("snarkjs");

const app = express();
const PORT = process.env.PORT || 3000;

// Project root
const projectRoot = path.join(__dirname, "..");
const publicFolder = path.join(projectRoot, "public");
const verificationKeyPath = path.join(
    projectRoot,
    "verification_key.json"
);

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Serve frontend
app.use(express.static(publicFolder));

// Serve files needed for proof generation
app.get("/marks_js/marks.wasm", (req, res) => {
    res.sendFile(
        path.join(projectRoot, "marks_js", "marks.wasm")
    );
});

app.get("/marks_final.zkey", (req, res) => {
    res.sendFile(
        path.join(projectRoot, "marks_final.zkey")
    );
});

app.get("/verification_key.json", (req, res) => {
    res.sendFile(verificationKeyPath);
});

// Backend health check
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "ZKP backend is running"
    });
});

// Verify Groth16 proof
app.post("/api/verify", async (req, res) => {
    try {
        const { proof, publicSignals } = req.body;

        if (!proof || !Array.isArray(publicSignals)) {
            return res.status(400).json({
                success: false,
                error: "Proof and publicSignals are required"
            });
        }

        const verificationKey = JSON.parse(
            fs.readFileSync(verificationKeyPath, "utf8")
        );

        const valid = await snarkjs.groth16.verify(
            verificationKey,
            publicSignals,
            proof
        );

        return res.json({
            success: true,
            verified: valid,
            message: valid
                ? "Proof verified successfully"
                : "Proof verification failed"
        });
    } catch (error) {
        console.error("Verification error:", error);

        return res.status(500).json({
            success: false,
            error: "Verification could not be completed"
        });
    }
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`ZKP backend running on port ${PORT}`);
});
