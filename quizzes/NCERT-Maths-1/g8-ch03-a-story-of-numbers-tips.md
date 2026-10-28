# A Story of Numbers — Tips & Tricks (Grade 8, Ganita Prakash Ch. 3)

Nine tricks that make every number system in this chapter easy to read, write and compare.

## 1. Count the landmarks, biggest first

**Why it works:** Every system in the chapter (Roman, Egyptian, base-5, Mesopotamian, Mayan) represents a number by grouping it into *landmark numbers*, always starting from the largest landmark that fits. If you grab the biggest piece first, you never end up with "too many" of a smaller piece.

**Worked example:** 2367 in Roman numerals. Largest landmark ≤ 2367 is M (1000): take two → 367 left. Next C (100): take three → 67 left. L (50): one → 17 left. X (10): one → 7. V (5): one → 2. I: two. Result: MMCCCLXVII.

**Try it yourself:** Write 1946 in Roman numerals using the same biggest-first steps.

## 2. The "one less" rule for 4 and 9

**Why it works:** Romans wrote 4 as IV (one less than five) and 40 as XL (ten less than fifty). A smaller symbol placed *before* a bigger one means "subtract". Only I, X and C are used this way, each in front of the next two landmarks.

**Worked example:** 2999 = 2000 + 900 + 90 + 9 → MM + CM + XC + IX = MMCMXCIX. Each of CM, XC and IX uses the one-less rule.

**Try it yourself:** Write 494 in Roman numerals. (Hint: it uses the one-less rule twice.)

## 3. Powers, not multiples — spotting a base-n landmark

**Why it works:** In a base-n system each landmark is n *times* the previous one (1, n, n², n³…), never n *more*. So landmark numbers of base-5 are 1, 5, 25, 125, 625 — not 5, 10, 15, 20.

**Worked example:** Is 343 a landmark of base-7? 7 × 7 = 49, 49 × 7 = 343. Yes — it is 7³. Is 350? No, it is just a multiple of 7.

**Try it yourself:** List the first five landmark numbers of a base-6 system, and say whether 36, 72 and 216 are landmarks.

## 4. "n of a kind" must regroup

**Why it works:** In a base-n system, n copies of any landmark equal the next landmark. So a correct representation never has n or more of the same symbol — in Egyptian (base-10) a symbol appears at most 9 times, in base-5 at most 4 times, in Mesopotamian (base-60) a position holds at most 59.

**Worked example:** 143 in base-5: 143 = 125 + 18, and 18 = 5 + 5 + 5 + 3. So one 125, three 5s, three 1s. If you had written "five 25s" instead of one 125, the regroup rule tells you to fix it.

**Try it yourself:** 1 × 3600 + 70 × 60 + 2 breaks the rule for base-60. Regroup it and find the number.

## 5. Count symbols by digits, not by size

**Why it works:** In Egyptian-style systems you draw each landmark symbol as many times as its count. The number of symbols is simply the *sum of the digits* in the Hindu numeral — so a huge number with small digits can need fewer symbols than a small number with big digits.

**Worked example:** 1111 needs 1 + 1 + 1 + 1 = 4 symbols. 784 needs 7 + 8 + 4 = 19 symbols even though it is smaller.

**Try it yourself:** How many Egyptian symbols do 2660 and 10458 need? Which needs fewer?

## 6. Multiplying by the base = shift every symbol up one landmark

**Why it works:** Because landmarks are powers of the base, multiplying any landmark by the base gives the *next* landmark (10 × 100 = 1000; 5 × 25 = 125). So to multiply a whole number by the base, just change each symbol into the next-landmark symbol. This is why multiplication is easy in base systems and hard in Roman numerals (V × L = 250 has no symbol).

**Worked example:** In base-5, 143 = (one 125, three 5s, three 1s). Multiply by 5: one 625, three 25s, three 5s = 625 + 75 + 15 = 715. Check: 143 × 5 = 715. ✓

**Try it yourself:** 324 in Egyptian numerals is three 100s, two 10s, four 1s. Write 324 × 10 and 324 × 100 by shifting.

## 7. Divide-and-remainder for place value in any base

**Why it works:** A place value numeral in base n is just the counts of n⁰, n¹, n², … Repeatedly dividing by n and keeping the remainders gives the digits from right to left — exactly what the book does with 25 = 3 × 8 + 1 → 31 in base-8.

**Worked example:** 25 in base-2: 25 ÷ 2 = 12 r 1; 12 ÷ 2 = 6 r 0; 6 ÷ 2 = 3 r 0; 3 ÷ 2 = 1 r 1; 1 ÷ 2 = 0 r 1. Read remainders bottom-up: 11001. Check: 16 + 8 + 1 = 25. ✓

**Try it yourself:** Write 41 in base-5 and in base-8, then check each by multiplying back.

## 8. Zero is the "nothing here" marker — look for the gap

**Why it works:** In a place value system every power must have a position, even when its count is zero. Mesopotamians left a blank (later a placeholder), Mayans drew a seashell, and the Hindu system uses 0. If a landmark is skipped in the grouping, a zero must sit in that position.

**Worked example:** 3605 = 1 × 3600 + 0 × 60 + 5 → the 60s position is empty, so the numeral needs a placeholder in the middle. 361 in Mayan = 1 × 360 + 0 × 20 + 1 → a seashell in the 20s row.

**Try it yourself:** Which of 721, 100 and 77 need a Mayan seashell, and in which row (1s, 20s or 360s)?

## 9. Same words, different system — read the rules first

**Why it works:** "ukasar-ukasar-urapon" means 2 + 2 + 1 = 5 in the Gumulgal *grouping* system, but in the book's base-2 *place value* system (ukasar = 1, urapon = 0) "uk uk ur" means 1 × 4 + 1 × 2 + 0 = 6. In a grouping system you *add* the words; in a place value system each position is a different power. Always ask: do positions matter here?

**Worked example:** "uk ur" in base-2 = 1 × 2 + 0 = 2, while Gumulgal "ukasar-urapon" = 2 + 1 = 3.

**Try it yourself:** Write 7 in both systems: as a Gumulgal name (counting by twos) and as a base-2 numeral using uk/ur.
