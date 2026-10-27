
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const snarkjs = require("snarkjs");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(projectRoot, "public")));

const projectRoot = path.join(__dirname, "..");
// Serve the website
app.use(express.static(path.join(projectRoot, "public")));

// Serve only the files required for ZK proof generation
app.get("/marks_js/marks.wasm", (req, res) => {
    res.sendFile(path.join(projectRoot, "marks_js", "marks.wasm"));
});

app.get("/marks_final.zkey", (req, res) => {
    res.sendFile(path.join(projectRoot, "marks_final.zkey"));
});

app.get("/verification_key.json", (req, res) => {
    res.sendFile(path.join(projectRoot, "verification_key.json"));
});

const verificationKeyPath = path.join(
  projectRoot,
  "verification_key.json"
);

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "ZKP backend is running"
  });
});

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
    console.error("Verification error:", error.message);

    return res.status(500).json({
      success: false,
      error: "Verification could not be completed"
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`ZKP backend running on port ${PORT}`);
});
