const form = document.getElementById("verifyForm");
const status = document.getElementById("status");
const result = document.getElementById("result");
const button = document.getElementById("verifyBtn");

form.addEventListener("submit", async (event) => {

    event.preventDefault();

    const studentName =
        document.getElementById("studentName").value.trim();

    const rollNumber =
        document.getElementById("rollNumber").value.trim();

    const marks =
        Number(document.getElementById("marks").value);

    const threshold =
        Number(document.getElementById("threshold").value);

    result.textContent = "";

    if (!studentName || !rollNumber) {
        status.textContent = "Enter student details.";
        return;
    }

    if (
        !Number.isInteger(marks) ||
        !Number.isInteger(threshold) ||
        marks < 0 || marks > 100 ||
        threshold < 0 || threshold > 100
    ) {
        status.textContent =
            "Enter whole numbers from 0 to 100.";
        return;
    }

    if (marks < threshold) {

        status.textContent = "Not Eligible";

        result.textContent =
            "Student: " + studentName +
            "\nRoll Number: " + rollNumber +
            "\nRequired marks: " + threshold +
            "\nEligibility: Not Eligible" +
            "\nNo proof was generated.";

        return;
    }

    button.disabled = true;
    status.textContent = "Generating ZK proof...";

    try {

        if (!window.snarkjs) {
            throw new Error("SnarkJS library did not load.");
        }

        const root = new URL("../", window.location.href);

        const wasm = new URL(
            "marks_js/marks.wasm", root
        ).href;

        const zkey = new URL(
            "marks_final.zkey", root
        ).href;

        const vkeyUrl = new URL(
            "verification_key.json", root
        ).href;

        const response = await fetch(vkeyUrl);

        if (!response.ok) {
            throw new Error("Verification key not found.");
        }

        const vkey = await response.json();

        // Generate individual student proof

        const generated =
            await window.snarkjs.groth16.fullProve(
                {
                    marks: marks,
                    threshold: threshold
                },
                wasm,
                zkey
            );

        status.textContent = "Verifying proof...";

        // Verify proof

        const verified =
            await window.snarkjs.groth16.verify(
                vkey,
                generated.publicSignals,
                generated.proof
            );

        if (!verified) {

            status.textContent =
                "Proof verification failed.";

            return;
        }

        status.textContent =
            "SUCCESS: Student Proof Verified!";

        result.textContent =
            "Student Name: " + studentName +
            "\nRoll Number: " + rollNumber +
            "\nRequired Marks: " + threshold +
            "\nProof Verified: true" +
            "\nPrivate Marks: Protected";

        // Create individual proof file

        const proofData = {
            studentName: studentName,
            rollNumber: rollNumber,
            proof: generated.proof,
            publicSignals: generated.publicSignals
        };

        const blob = new Blob(
            [JSON.stringify(proofData, null, 2)],
            { type: "application/json" }
        );

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        const safeRoll = rollNumber.replace(
            /[^a-zA-Z0-9_-]/g, "_"
        );

        link.href = url;

        link.download =
            "zkp-proof-" + safeRoll + ".json";

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);

        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 2000);

        status.textContent =
            "Proof verified and downloaded successfully!";

    } catch (error) {

        console.error(error);

        status.textContent =
            "Error: " + error.message;

    } finally {

        button.disabled = false;

    }

});