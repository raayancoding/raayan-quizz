# A Square and A Cube — Tips & Tricks (NCERT Grade 8, Ganita Prakash Ch. 1)

Quick tricks straight from the chapter, with the *why* behind each one.

## 1. The "partner factor" trick: squares are the odd ones out

**Why it works:** Every factor of a number has a partner so that the pair multiplies to the number (for 6: 1×6 and 2×3). Partners come in twos, so the factor count is usually even. The only time a factor has *itself* as a partner is when the number is a perfect square (6×6 = 36). That single self-paired factor makes the count odd.

**Worked example:** 36 → pairs 1×36, 2×18, 3×12, 4×9 and 6×6. Factors: 1, 2, 3, 4, 6, 9, 12, 18, 36 = **9 factors** (odd). That is why locker 36 stays open in the Queen's puzzle, while locker 12 (1, 2, 3, 4, 6, 12 = 6 factors) ends closed.

**Try it yourself:** Does locker 81 end open or closed? List its factor pairs to decide.

## 2. Last-digit lie detector

**Why it works:** The units digit of n² depends only on the units digit of n. Squaring 0–9 gives 0, 1, 4, 9, 6, 5, 6, 9, 4, 1 — so a square can never end in **2, 3, 7 or 8**. But a "good" ending proves nothing (26 ends in 6 and is not a square).

**Worked example:** 2032, 2048, 1027 end in 2, 8, 7 → definitely not squares. 1089 ends in 9 → *might* be; check: 33² = 1089 ✓.

**Try it yourself:** Which of 1521, 1523, 1527, 1528 can you reject instantly? Which one must you actually check?

## 3. Counting zeros: squares double, cubes triple

**Why it works:** (a × 10ᵏ)² = a² × 10²ᵏ and (a × 10ᵏ)³ = a³ × 10³ᵏ. Every trailing zero of the number becomes two in the square and three in the cube. So squares have an even number of trailing zeros and cubes have a multiple of three.

**Worked example:** 7000² = 49 000 000 (3 zeros → 6). 10³ = 1000 (1 zero → 3). So 2 500 000 (five zeros) cannot be a square, and no cube ends in exactly "00".

**Try it yourself:** How many zeros end 70000²? Could 640 000 be a perfect cube?

## 4. Next square without multiplying: add the next odd number

**Why it works:** n² = 1 + 3 + 5 + … + (2n − 1). So (n+1)² = n² + (2n + 1), and the number you add is just n + (n+1).

**Worked example:** 35² = 1225. The 36th odd number is 2×36 − 1 = 71 (= 35 + 36). So 36² = 1225 + 71 = 1296. Going down works too: 50² = 2500, so 49² = 2500 − 99 = 2401.

**Try it yourself:** Given 125² = 15625, find 126² and 124² without multiplying.

## 5. Is it a square? Keep subtracting odd numbers

**Why it works:** Since every square is 1 + 3 + 5 + …, subtracting 1, 3, 5, … from a perfect square lands *exactly* on 0, and the number of steps is the square root. A non-square jumps over 0.

**Worked example:** 81 − 1 = 80, −3 = 77, −5 = 72, −7 = 65, −9 = 56, −11 = 45, −13 = 32, −15 = 17, −17 = 0 → 9 steps, so √81 = 9. For 38: 37, 34, 29, 22, 13, 2, −11 → misses 0, so 38 is not a square.

**Try it yourself:** Use the method on 50 and on 64. Which one reaches 0, and after how many steps?

## 6. How many numbers sit between two squares? Just double

**Why it works:** (n+1)² − n² = 2n + 1, so the numbers strictly between n² and (n+1)² number 2n + 1 − 1 = **2n**.

**Worked example:** Between 16² and 17² there are 2×16 = 32 numbers; between 99² and 100² there are 198. If there are exactly 50 numbers between two consecutive squares, then 2n = 50, so they are 25² and 26².

**Try it yourself:** How many numbers lie between 40² and 41²? Between which two consecutive squares are there exactly 80 numbers?

## 7. Pair up (or triple up) the prime factors

**Why it works:** n² has every prime of n twice, and n³ has every prime three times. So a number is a perfect square exactly when its prime factors can be split into two identical groups, and a perfect cube when they split into three. Whatever is left over tells you the smallest multiplier (or divisor) to fix it.

**Worked example:** 9408 = 2⁶ × 3 × 7². Only the 3 is unpaired, so multiply by 3: 28224 = (2³ × 3 × 7)² = 168². For cubes: 1323 = 3³ × 7² needs one more 7 → 9261 = 21³.

**Try it yourself:** 2800 = 2⁴ × 5² × 7. What is the smallest number to multiply by to get a perfect square? To divide by?

## 8. Sandwich the root between squares you know

**Why it works:** If a² < N < b², then a < √N < b. Combine this with the last-digit rule to pin the root down, and test the midpoint to halve the search.

**Worked example:** √1936: 40² = 1600 < 1936 < 2500 = 50², so it is in the 40s. It ends in 6, so the root ends in 4 or 6 → 44 or 46. 45² = 2025 > 1936, so the root is below 45: **44**. For a non-square like 250: 15² = 225 < 250 < 256 = 16², and 250 is much nearer 256, so √250 ≈ 16 (a little less).

**Try it yourself:** Find √2116 using the sandwich + last-digit method. Estimate √700 to the nearest whole number.

## 9. Guess a cube root from its last digit

**Why it works:** Cube last digits are all different for the digits 0–9: 1→1, 2→8, 3→7, 4→4, 5→5, 6→6, 7→3, 8→2, 9→9, 0→0. So the last digit of a cube tells you the last digit of its root; the leading part tells you the tens digit.

**Worked example:** ∛4913: ends in 3, so the root ends in 7. Drop the last three digits: 4 lies between 1³ = 1 and 2³ = 8, so the tens digit is 1 → **17**. ∛32768: ends in 8 → root ends in 2; 32 lies between 27 and 64 → tens digit 3 → **32**.

**Try it yourself:** Guess ∛12167 and ∛10648 without factorising, then check by multiplying.

## 10. Cubes from odd numbers, and Ramanujan's taxi

**Why it works:** Consecutive odd numbers also build cubes: 1 = 1³, 3 + 5 = 2³, 7 + 9 + 11 = 3³, 13 + 15 + 17 + 19 = 4³ — n³ is the sum of n consecutive odd numbers, each block starting where the last one stopped. Also, differences of cubes become constant (6) only after three levels, compared with two levels (constant 2) for squares — a quick way to tell the two sequences apart.

**Worked example:** 91 + 93 + … + 109 has ten terms with average 100, so the sum is 10³ = 1000. And the famous 1729 = 1³ + 12³ = 9³ + 10³ is the smallest "taxicab number" (sum of two cubes in two ways); the next two are 4104 and 13832.

**Try it yourself:** Write 5³ as a sum of five consecutive odd numbers. Can you express 4104 as a sum of two cubes in two different ways?
