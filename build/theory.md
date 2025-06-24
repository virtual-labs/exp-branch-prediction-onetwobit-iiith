### Theory
Branch prediction is a technique used in computer architecture to improve the performance of pipelined processors. When a conditional branch instruction is encountered, the processor has to decide which instruction to fetch next. This can cause a delay, as the outcome of the branch is not known until the instruction is executed. Branch predictors attempt to guess the outcome of the branch, allowing the processor to fetch and execute instructions speculatively. If the prediction is correct, the pipeline continues without interruption. If the prediction is incorrect, the speculatively executed instructions are discarded, and the pipeline is flushed, which incurs a performance penalty.

#### One-Bit Predictor
The one-bit predictor is the simplest type of branch predictor. It uses a single bit to store the history of the last outcome of a branch. If the last branch was taken, the bit is set to 1. If the last branch was not taken, the bit is set to 0. The next time the branch is encountered, the predictor uses this bit to predict the outcome. If the bit is 1, the branch is predicted as taken. If the bit is 0, the branch is predicted as not taken. The state of the predictor is updated after the actual outcome of the branch is known.

#### Two-Bit Predictor
The two-bit predictor uses two bits to store the history of a branch, which allows for four states. This makes it more resilient to temporary changes in branch behavior. The four states can be represented as:
- 00: Strongly not taken
- 01: Weakly not taken
- 10: Weakly taken
- 11: Strongly taken

When a branch is encountered, the prediction is based on the most significant bit of the two-bit counter. If the MSB is 1, the branch is predicted as taken. If the MSB is 0, the branch is predicted as not taken. The counter is updated based on the actual outcome of the branch. If the branch is taken, the counter is incremented (up to a maximum of 11). If the branch is not taken, the counter is decremented (down to a minimum of 00). This two-bit scheme means that a single deviation from the usual branch behavior will not cause a misprediction on the next occurrence. For example, if the state is 'Strongly taken' (11) and the branch is not taken once, the state changes to 'Weakly taken' (10), and the next prediction will still be 'taken'. It takes two consecutive incorrect outcomes to change the prediction.