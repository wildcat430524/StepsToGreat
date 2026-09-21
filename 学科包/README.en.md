# Subject Packs

> One subject pack = one Markdown file that defines **what the three-dimension assessment looks like for that subject**.
> Before teaching, the tutor must read this README and pick a pack; if none fits, generate one on the spot from [`_自定义学科包模板.md`](./_自定义学科包模板.md).
> Chinese version: [`README.md`](./README.md)

---

## 1. Why subject packs are needed

`协议/00_导师协议.md` defines the **mechanism** of the three-dimension assessment (three independent dimensions; only all-✅ counts as mastered),
but "what dimension ③ is called, what it judges, and what counts as an exemptable slip" **differs for every subject**:

| Subject | Dimension ③ | What it judges |
|---|---|---|
| Programming | Compilability | Code is structurally correct and runs |
| English | Expression | Grammar, tense, collocation, spelling structure |
| Humanities | Argumentation | Argument structure, terminology, citation |
| Science / Math | Derivation & calculation | Symbols, steps, units, computation |
| Postgraduate exam / civil service exam | Answer format | Question format, scoring-point coverage |

A subject pack is where this table gets **expanded into a full definition**.

---

## 2. Built-in subject packs

| File | Coverage |
|---|---|
| [`编程.md`](./编程.md) | All kinds of programming languages, algorithms, engineering practice |
| [`语言.md`](./语言.md) | Foreign-language learning such as English and Japanese |
| [`文科.md`](./文科.md) | History, politics, philosophy, law, literature |
| [`理科.md`](./理科.md) | Math, physics, chemistry, biology |
| [`考试.md`](./考试.md) | Exam-oriented tracks such as postgraduate entrance, civil service, certification |

> A subject may span several packs (e.g. "postgraduate math" = Science + Exam) → **the primary pack governs; append the other pack's criteria after it**, and note in the student profile which set you used.

---

## 3. How to choose (tutor decision tree)

```
What does the student want to learn?
├─ Programming language / algorithms / frameworks / engineering  → 编程.md
├─ Foreign language (English, Japanese…)                         → 语言.md
├─ History / politics / philosophy / law / literature            → 文科.md
├─ Math / physics / chemistry / biology                          → 理科.md
├─ The goal is an exam (postgraduate / civil service / certification) → 考试.md (+ the matching content subject pack)
└─ None of the above (instrument, fitness, writing, software usage…) → generate a custom pack on the spot
```

**Ask yourself one question**: for this subject's answers, what is a **structural error** (must lose points), and what is a **slip** (no points lost)?
Can answer it → write the pack from the template; can't → first ask the student "how does your teacher / the exam deduct points?"

---

## 4. Steps to generate a custom subject pack

1. Copy [`_自定义学科包模板.md`](./_自定义学科包模板.md) to `<subject-name>.md`.
2. Fill in 5 things:
   - What dimensions ① / ② / ③ are each called and what each judges (**must be three independent ones**, they cannot be merged)
   - This subject's **typical exemptable slips** (write them down to avoid false deductions)
   - This subject's **typical fatal errors** (write them down to avoid missing a verdict)
   - **Question forms** (how questions make sense in this subject: write code? translate? argue? solve problems?)
   - **Verification methods** (how to confirm the student really knows it: run the code? restate? change the scenario?)
3. Save it under `学科包/`, and note in 📋 Student Info of `我的学习/00-学习档案.md` which set you used.
4. If this subject is **very common** (e.g. "instrument", "fitness"), you are welcome to open a PR to this repo so the next person doesn't have to write it.

---

## 5. Discipline

- ❌ Never merge the three dimensions into one "overall score" — the all-✅-to-advance mechanism depends on the dimensions staying independent.
- ❌ Never skip dimension ③ just because the subject "isn't quantifiable" — **give it a different name** but keep it (e.g. "clarity of expression", "completeness of steps").
- ✅ A subject pack defines only the **assessment criteria**; it does not define course content (content is generated on the spot by the tutor from the student's material).
