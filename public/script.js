
const form = document.getElementById("verifyForm");
const status = document.getElementById("status");
const result = document.getElementById("result");
const button = document.getElementById("verifyBtn");

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const marks = Number(document.getElementById("marks").value);
    const threshold = Number(
        document.getElementById("threshold").value
    );

    result.textContent = "";

    if (
        !Number.isInteger(marks) ||
        !Number.isInteger(threshold) ||
        marks < 0 || marks > 100 ||
        threshold < 0 || threshold > 100
    ) {
        status.textContent = "Enter whole numbers from 0 to 100.";
        return;
    }
    if (marks < threshold) {
    status.textContent =
        "Not Eligible — Minimum " + threshold + " marks required.";

    result.textContent =
        "Your marks do not meet the required threshold.\n" +
        "No proof was generated.";

    return;
}

    button.disabled = true;
    status.textContent = "Generating ZK proof...";

    try {
        if (!window.snarkjs) {
            throw new Error("SnarkJS library did not load.");
        }

        const root = new URL("../", window.location.href);
        const wasm = new URL("marks_js/marks.wasm", root).href;
        const zkey = new URL("marks_final.zkey", root).href;
        const vkeyUrl = new URL("verification_key.json", root).href;

        const response = await fetch(vkeyUrl);

        if (!response.ok) {
            throw new Error("Verification key not found.");
        }

        const vkey = await response.json();

        const generated = await window.snarkjs.groth16.fullProve(
            { marks: marks, threshold: threshold },
            wasm,
            zkey
        );

        const verified = await window.snarkjs.groth16.verify(
            vkey,
            generated.publicSignals,
            generated.proof
        );

        if (!verified) {
            status.textContent = "Proof verification failed.";
            return;
        }

        status.textContent = "SUCCESS: Proof verified!";

        result.textContent =
            "Required threshold: " + generated.publicSignals[0] +
            "\nProof verified: true" +
            "\nPrivate marks are not displayed.";

        // Download the verified proof as a JSON file
        const proofData = {
            proof: generated.proof,
            publicSignals: generated.publicSignals
        };

        
const blob = new Blob(
    [JSON.stringify(proofData, null, 2)],
    { type: "application/json" }
);

const url = URL.createObjectURL(blob);
const link = document.createElement("a");

link.href = url;
link.download = "zkp-proof.json";
link.style.display = "none";

document.body.appendChild(link);
link.click();
document.body.removeChild(link);

status.textContent = "Proof verified! Download requested.";

setTimeout(() => URL.revokeObjectURL(url), 2000);

    } catch (error) {
        console.error(error);
        status.textContent = "Error: " + error.message;
    } finally {
        button.disabled = false;
    }
});
