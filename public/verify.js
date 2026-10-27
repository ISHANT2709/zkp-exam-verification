
const fileInput = document.getElementById("proofFile");
const button = document.getElementById("verifyBtn");
const status = document.getElementById("status");
const result = document.getElementById("result");

button.addEventListener("click", async () => {
    const file = fileInput.files[0];

    result.textContent = "";

    if (!file) {
        status.textContent = "Please select zkp-proof.json first.";
        return;
    }

    button.disabled = true;
    status.textContent = "Sending proof to secure verifier...";

    try {
        const data = JSON.parse(await file.text());

        if (
            !data.proof ||
            !Array.isArray(data.publicSignals)
        ) {
            throw new Error("Invalid proof JSON format.");
        }

        const response = await fetch(
            "/api/verify",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    proof: data.proof,
                    publicSignals: data.publicSignals
                })
            }
        );

        const verification = await response.json();

        if (!response.ok || verification.success !== true) {
            throw new Error(
                verification.error ||
                "Backend verification request failed."
            );
        }

        if (verification.verified === true) {
            status.textContent = "SUCCESS: Proof is valid!";

            result.textContent =
                "Cryptographic verification: PASSED\n" +
                "Public threshold: " +
                data.publicSignals[0] + "\n" +
                "Private marks: not displayed.";
        } else if (verification.verified === false) {
            status.textContent = "FAILED: Invalid proof.";

            result.textContent =
                "Cryptographic verification: FAILED\n" +
                "The backend rejected this proof.";
        } else {
            throw new Error(
                "Unexpected response from verification server."
            );
        }
    } catch (error) {
        console.error("Verification error:", error);

        status.textContent =
            "Verification error: " + error.message;
    } finally {
        button.disabled = false;
    }
});
