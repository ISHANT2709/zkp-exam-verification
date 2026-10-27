
pragma circom 2.1.6;

include "circomlib/circuits/comparators.circom";

template MarksVerification() {
    signal input marks;
    signal input threshold;

    // Marks must be between 0 and 100
    component marksLimit = LessThan(7);
    marksLimit.in[0] <== marks;
    marksLimit.in[1] <== 101;
    marksLimit.out === 1;

    // Threshold must be between 0 and 100
    component thresholdLimit = LessThan(7);
    thresholdLimit.in[0] <== threshold;
    thresholdLimit.in[1] <== 101;
    thresholdLimit.out === 1;

    // Prove that marks >= threshold
    component comparison = LessThan(7);
    comparison.in[0] <== marks;
    comparison.in[1] <== threshold;
    comparison.out === 0;
}

component main {public [threshold]} = MarksVerification();
