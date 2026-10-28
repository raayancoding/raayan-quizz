# Number Play — Tips & Tricks (NCERT Grade 8, Ganita Prakash Chapter 5)

Ten shortcuts from the chapter, each with *why it works*, a worked example and a "try it yourself".

---

## 1. Four consecutive numbers? The sum is always "4 × something + 6"

**The trick:** Call the smallest number *n*. Then the four numbers are n, n+1, n+2, n+3 and their sum is **4n + 6**. So a sum of four consecutive numbers is always 2 more than a multiple of 4 — and you can find the numbers by solving 4n + 6 = (sum).

**Why it works:** The extra 1 + 2 + 3 = 6 is the same no matter where you start; only the 4n part changes.

**Worked example:** The sum is 34. 4n + 6 = 34 → 4n = 28 → n = 7. The numbers are 7, 8, 9, 10. Check: 7 + 8 + 9 + 10 = 34 ✓. And 40 can *never* be such a sum because 40 is a multiple of 4.

**Try it yourself:** Can 58 be written as the sum of four consecutive numbers? If yes, which ones?

---

## 2. Switch a sign, the parity never changes

**The trick:** Take any numbers a, b, c, d and put + or − between them. All 8 expressions a ± b ± c ± d have the **same parity** (all even or all odd). So you only need to work out one of them!

**Why it works:** Changing +b to −b changes the value by (a + b − c − d) − (a − b − c − d) = **2b**, an even amount. Adding or subtracting an even number never flips odd ↔ even.

**Worked example:** For 3, 4, 5, 6: 3 + 4 + 5 + 6 = 18 is even. So 3 − 4 − 5 + 6 must be even too — and indeed it equals 0. 3 − 4 − 5 − 6 = −12, also even.

**Try it yourself:** For 2, 5, 9, 11, work out just 2 + 5 + 9 + 11. Is 2 − 5 − 9 + 11 even or odd? Check your prediction.

---

## 3. Spot an "always even" expression by pulling out a 2

**The trick:** An algebraic expression is even for *every* integer value if you can write it as **2 × (something)**. If you can't, look for one value that makes it odd.

**Why it works:** Having 2 as a factor is exactly what "even" means — and it stays true whatever numbers the letters take.

**Worked example:** 4m + 2q = 2(2m + q) → always even (m = 4, q = −9 gives −2 ✓). But x² + 2: x = 6 gives 38 (even), x = 3 gives 11 (odd) → *not* always even, because x² has the same parity as x.

**Try it yourself:** Is 6m − 3n always even? Find a factorisation or a pair of values that makes it odd.

---

## 4. "Pairs to make fours": match the remainders

**The trick:** Every even number is either a multiple of 4 (remainder 0) or **2 more** than one (remainder 2). Two evens add to a multiple of 4 exactly when they are the **same type**: 0 + 0 = 0, or 2 + 2 = 4.

**Why it works:** (4p + 2) + (4q + 2) = 4p + 4q + 4 = 4(p + q + 1) — the two leftover 2s join into one more row of 4. Mixing types gives 4(p + q) + 2, remainder 2.

**Worked example:** 18 and 30 both leave remainder 2 → 18 + 30 = 48 = 4 × 12 ✓. But 12 + 6 = 18 (one of each type) is not a multiple of 4.

**Try it yourself:** Without adding, decide whether 26 + 46 is a multiple of 4. Then check.

---

## 5. Always / Sometimes / Never: prove with letters, disprove with one example

**The trick:** To show a statement is **always true**, write the numbers with letters (8a, 8b, 6x, 9y …) and factorise. To show it is only **sometimes true**, find one example *and* one counterexample. To show **never true**, find a contradiction (like even = odd).

**Why it works:** Letters cover infinitely many cases at once; a single counterexample is enough to break a universal claim.

**Worked example:** "Multiple of 6 + multiple of 9 is a multiple of 3": 6x + 9y = 3(2x + 3y) → always. "Not divisible by 18 ⇒ not divisible by 9": 30 fits, but 27 breaks it → sometimes. "Odd + even = multiple of 6": 2(n + m) = 6j − 1 would make even = odd → never.

**Try it yourself:** Is "the sum of three consecutive even numbers is divisible by 6" always, sometimes or never true? Use 2n, 2n + 2, 2n + 4.

---

## 6. Remainders add (and subtract) — then reduce

**The trick:** To find the remainder of a sum or difference, just add or subtract the remainders, then take away the divisor if you go over. Numbers with remainder r on division by d are written **dk + r**.

**Why it works:** (7p + 5) + (7q + 3) = 7(p + q) + 8 = 7(p + q + 1) + 1. The 7-groups stay 7-groups; only the leftovers matter.

**Worked example:** 4779 leaves 5 and 661 leaves 3 when divided by 7. Sum: 5 + 3 = 8 → 8 − 7 = **1**. Difference: 5 − 3 = **2**. No long division needed!

**Try it yourself:** A number leaves remainder 4 when divided by 6, another leaves 5. What remainder does their sum leave on division by 6?

---

## 7. "One less than everything" puzzles: use the LCM

**The trick:** If a number leaves remainder 2 on ÷3, 3 on ÷4 and 4 on ÷5 — each remainder is **one short of the divisor** — then the number is one less than a common multiple of 3, 4, 5. Smallest answer: LCM − 1.

**Why it works:** Add 1 to the number and every division comes out exact, so (number + 1) is a common multiple. The smallest common multiple is the LCM.

**Worked example:** LCM(3, 4, 5) = 60, so the smallest such number is 60 − 1 = **59**. The next is 119. (Pebble riddle: remainder 1 on ÷2, ÷3, ÷5 → 30k + 1 = 31, 61, 91; only 91 is divisible by 7.)

**Try it yourself:** Find the smallest number that leaves remainder 1 on division by 2, by 3 and by 4, and is a multiple of 5.

---

## 8. Divisible by 9 or 3? Add the digits — and the digit sum is the remainder

**The trick:** Add all the digits; keep adding until you get one digit (the **digital root**). If it is 9, the number is a multiple of 9; otherwise it is the remainder on division by 9. For 3, check whether the digit sum is a multiple of 3.

**Why it works:** 10 = 9 + 1, 100 = 99 + 1, 1000 = 999 + 1 … so each place value is 1 more than a multiple of 9, and each digit simply contributes itself to the remainder.

**Worked example:** 7309 → 7 + 3 + 0 + 9 = 19 → 1 + 9 = 10 → 1. So 7309 is 1 more than a multiple of 9. For 31z5 to be a multiple of 9, 9 + z must be a multiple of 9 → z = 0 or 9.

**Try it yourself:** Without dividing, find the remainder when 58 236 is divided by 9. Is it divisible by 3?

---

## 9. Divisible by 11? Alternate the signs from the units digit

**The trick:** Starting at the units digit, put +, −, +, − … in front of the digits and add up. If the result is 0 or a multiple of 11, the number is divisible by 11. A positive single-digit result is the remainder; a negative result like −3 means "3 short", i.e. remainder 8.

**Why it works:** 1, 100, 10000 … are each **1 more** than a multiple of 11; 10, 1000, 100000 … are each **1 less** (10 = 11 − 1, 1000 = 1001 − 1). The + digits count the excess, the − digits count the shortfall.

**Worked example:** 462: +2 − 6 + 4 = 0 → divisible (462 = 11 × 42). 481: +1 − 8 + 4 = −3 → 3 short of 484, so the remainder is 8.

**Try it yourself:** Is 5529 divisible by 11? If not, what is the remainder?

---

## 10. Check a big divisor with two *coprime* helpers

**The trick:** To test divisibility by 6, 12, 18, 24, 36, 44 … split it into two factors that **share no common factor** and apply both simple tests: 6 = 2 × 3, 12 = 3 × 4, 18 = 2 × 9, 24 = 3 × 8, 36 = 4 × 9, 44 = 4 × 11.

**Why it works:** Passing tests for k and m only guarantees divisibility by LCM(k, m). If the pair shares a factor the LCM is smaller than the product: LCM(4, 6) = 12, not 24 — that is why 12 passes "4 and 6" but is not a multiple of 24.

**Worked example:** 2856: last three digits 856 = 8 × 107 ✓ and digit sum 21 is a multiple of 3 ✓ → divisible by 24 (2856 = 24 × 119). For 48a23b to be a multiple of 18: b even *and* 17 + a + b a multiple of 9 → pairs (1,0), (8,2), (6,4), (4,6), (2,8).

**Try it yourself:** Using the tests for 4 and 9, find the smallest multiple of 36 that is bigger than 45,100.

---

### Bonus: cryptarithm starters
- Look at the **units column** first: in JK × 6 = KKK, 6 × K must end in K, so K is 2, 4, 6 or 8.
- Count **digits** to bound the first letter: in BYE × 6 = RAY, B must be 1 (200 × 6 = 1200 already has four digits).
- Remember the rules: each letter is one digit, no digit is shared by two letters, and a number never starts with 0.
