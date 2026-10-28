# We Distribute, Yet Things Multiply — Tips & Tricks

Nine shortcuts from NCERT Grade 8 *Ganita Prakash* Chapter 6. Each one comes straight from the chapter, with the reason it works, a worked example, and one to try on your own.

## 1. Break the bracket, multiply every piece

**The trick:** `a(b + c) = ab + ac`. Whatever is outside the bracket must multiply EVERY term inside — not just the first one.

**Why it works:** Picture a rows of dots with (b + c) dots in each row. Split the columns into b and c: you get an a × b block and an a × c block. Together they are still the whole rectangle.

**Worked example:** `(2/3)(15 + 6a)` → `(2/3) × 15 + (2/3) × 6a = 10 + 4a`.

**Try it yourself:** Expand `−3p(−5p + 2q)`. (Watch the signs — this is item 1 of "Mind the Mistake".)

## 2. The "everything times everything" rule for two brackets

**The trick:** `(a + m)(b + n) = ab + an + mb + mn` — four products, one for every pair (one term from each bracket).

**Why it works:** Treat `(a + m)` as a single number first: `(a + m)(b + n) = (a + m)b + (a + m)n`. Then distribute again. The dot-diagram shows four rectangles: ab, an, mb and mn.

**Worked example:** `(3 + u)(v − 3) = 3v − 9 + uv − 3u`.

**Try it yourself:** Expand `(5 + z)(y + 9)` — you should get four terms.

## 3. Predict how a product changes without recomputing

**The trick:** If one factor goes up by 1, the product goes up by the *other* factor. If both go up by 1, the product goes up by `a + b + 1`. If one goes up and the other down by 1, the change is `b − a − 1`.

**Why it works:** `(a + 1)(b + 1) = ab + a + b + 1` — the extra bits are an extra column (a), an extra row (b) and the corner dot (1).

**Worked example:** 23 × 27 = 621, so 24 × 28 = 621 + 23 + 27 + 1 = 672.

**Try it yourself:** Using 23 × 27 = 621, find 24 × 26 in your head.

## 4. Multiply by 11 in one line

**The trick:** Write the first digit, then each pair of neighbouring digits added together, then the last digit. Carry when a sum is 10 or more.

**Why it works:** `× 11 = × 10 + × 1`, so you are adding the number to itself shifted one place left — each column adds two neighbouring digits.

**Worked example:** 495 × 11 → 4 | 4+9 | 9+5 | 5 → 4 | 13 | 14 | 5 → resolve carries → **5445**.

**Try it yourself:** Find 3279 × 11 in one line.

## 5. Multiply by 101, 1001, 99 and 999 the same way

**The trick:** `× 101 = × 100 + × 1` (shift two places and add), `× 1001` shifts three places. For 99 and 999 use `100 − 1` and `1000 − 1` and *subtract*.

**Why it works:** Distributivity again: `n × (100 − 1) = 100n − n`. Brahmagupta called this *ista-gunana*.

**Worked example:** 9734 × 99 = 973400 − 9734 = **963666**.

**Try it yourself:** Find 89 × 101 and 1111 × 1001.

## 6. Square a number near a round number

**The trick:** `(a + b)² = a² + 2ab + b²` and `(a − b)² = a² − 2ab + b²`. Split the number into a round part and a small part. Never forget the middle term `2ab`!

**Why it works:** A square of side (a + b) is a big a-square, a small b-square and TWO a × b rectangles — that's where the 2 comes from.

**Worked example:** 104² = (100 + 4)² = 10000 + 800 + 16 = **10816**. And 99² = (100 − 1)² = 10000 − 200 + 1 = **9801**.

**Try it yourself:** Find 58² using (60 − 2)².

## 7. Multiply two numbers that straddle a round number

**The trick:** `(a + b)(a − b) = a² − b²`. If two numbers are the same distance above and below a round number, square the round number and subtract the square of the distance.

**Why it works:** The cross terms `−ab + ba` cancel out, leaving only the two squares.

**Worked example:** 98 × 102 = (100 − 2)(100 + 2) = 10000 − 4 = **9996**. Also 45 × 55 = 50² − 5² = 2500 − 25 = **2475**.

**Try it yourself:** Find 397 × 403 and 43 × 45.

## 8. Sridharacharya's square trick

**The trick:** `a² = (a + b)(a − b) + b²`. Pick b so that `a + b` (or `a − b`) becomes a round number, multiply, then add `b²`.

**Why it works:** It is Identity 1C turned around: since `(a + b)(a − b) = a² − b²`, adding `b²` back gives `a²`.

**Worked example:** 197² with b = 3: (200)(194) + 9 = 38800 + 9 = **38809**.

**Try it yourself:** Find 31² by taking b = 1.

## 9. Spot the classic mistakes before you make them

**The trick:** Three slips cause most wrong answers in this chapter:
- Forgetting the middle term: `(5m + 6n)²` is **not** `25m² + 36n²`.
- Adding unlike terms: `5w² + 6w` **cannot** become `11w²` — w² and w are different letter-numbers.
- Distributing over a product: `3a(2b × 3c)` is `18abc`, not `6ab × 9ac`. Distributivity only works over `+` and `−`.

**Why it works:** Each identity is just "everything times everything" written tidily. If a step skips a product or merges terms with different letters, the identity has been broken.

**Worked example:** `2(x − 1) + 3(x + 4) = 2x − 2 + 3x + 12 = 5x + 10` (not `5x + 3` — the 2 and 3 must multiply the constants too).

**Try it yourself:** Decide which of these is already correct and fix the other: `y + 2(y + 2) = (y + 2)²` and `(−q + 2)² = q² − 4q + 4`.
