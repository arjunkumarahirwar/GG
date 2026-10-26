import base64
import json
import re
import time

import fitz  # PyMuPDF
import requests
import streamlit as st

st.set_page_config(page_title="Mock Test Maker", page_icon="📝")

API_KEY = st.secrets.get("OPENROUTER_API_KEY", "")
PASSWORD = st.secrets.get("APP_PASSWORD", "")
MODEL = st.secrets.get("MODEL", "google/gemini-2.0-flash-exp:free")

PROMPT = (
    "These are scanned pages from a question paper. Extract every question. "
    "Return ONLY a JSON array, no other text. Each item: "
    '{"question": str, "options": [str, ...], "answer": int or null}. '
    "options is [] if the question has no choices. answer is the 0-based index "
    "of the correct option if the pages show it, otherwise null."
)


# ---------- password gate ----------
if "authed" not in st.session_state:
    st.session_state.authed = False
if not st.session_state.authed:
    st.title("📝 Mock Test Maker")
    pw = st.text_input("Password", type="password")
    if st.button("Enter"):
        if PASSWORD and pw == PASSWORD:
            st.session_state.authed = True
            st.rerun()
        else:
            st.error("Wrong password.")
    st.stop()


# ---------- extraction ----------
def extract_questions(pdf_bytes, pages_per_call=3, progress=None):
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    questions = []
    total = len(doc)
    for start in range(0, total, pages_per_call):
        content = [{"type": "text", "text": PROMPT}]
        for i in range(start, min(start + pages_per_call, total)):
            png = doc[i].get_pixmap(dpi=130).tobytes("png")
            b64 = base64.b64encode(png).decode()
            content.append(
                {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64}"}}
            )
        r = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={"Authorization": f"Bearer {API_KEY}"},
            json={"model": MODEL, "messages": [{"role": "user", "content": content}]},
            timeout=180,
        )
        r.raise_for_status()
        text = r.json()["choices"][0]["message"]["content"]
        match = re.search(r"\[.*\]", text, re.S)
        if match:
            try:
                questions.extend(json.loads(match.group(0)))
            except json.JSONDecodeError:
                pass
        if progress:
            progress(min(start + pages_per_call, total) / total)
    return questions


# ---------- state ----------
S = st.session_state
S.setdefault("stage", "setup")
S.setdefault("questions", [])


def go_to(idx):
    now = time.time()
    S.times[S.cur] = S.times.get(S.cur, 0) + (now - S.qstart)
    S.cur = idx
    S.qstart = now


def finish():
    S.times[S.cur] = S.times.get(S.cur, 0) + (time.time() - S.qstart)
    S.stage = "result"


# ---------- setup ----------
if S.stage == "setup":
    st.title("📝 Mock Test Maker")
    pdf = st.file_uploader("Upload your scanned PDF", type="pdf")
    minutes = st.number_input("Test duration (minutes)", 1, 300, 30)
    if pdf and st.button("Extract questions"):
        bar = st.progress(0.0, text="Reading pages...")
        try:
            S.questions = extract_questions(
                pdf.read(), progress=lambda p: bar.progress(p, text="Reading pages...")
            )
        except Exception as e:
            st.error(f"Extraction failed: {e}")
        bar.empty()
    if S.questions:
        st.success(f"Found {len(S.questions)} questions.")
        if st.button("Start test"):
            S.answers, S.times, S.cur = {}, {}, 0
            S.qstart = time.time()
            S.end = time.time() + minutes * 60
            S.stage = "test"
            st.rerun()

# ---------- test ----------
elif S.stage == "test":

    @st.fragment(run_every=1)
    def clock():
        left = int(S.end - time.time())
        if left <= 0:
            finish()
            st.rerun()
        st.metric("Time left", f"{left // 60:02d}:{left % 60:02d}")

    clock()
    qs = S.questions
    i = S.cur
    q = qs[i]
    st.subheader(f"Question {i + 1} of {len(qs)}")
    st.write(q.get("question", ""))
    opts = q.get("options") or []
    if opts:
        pick = st.radio(
            "Your answer", range(len(opts)), format_func=lambda k: opts[k],
            index=S.answers.get(i), key=f"q{i}",
        )
        S.answers[i] = pick
    else:
        S.answers[i] = st.text_area("Your answer", S.answers.get(i, ""), key=f"q{i}")

    c1, c2, c3 = st.columns(3)
    if c1.button("◀ Prev", disabled=i == 0):
        go_to(i - 1)
        st.rerun()
    if c2.button("Next ▶", disabled=i == len(qs) - 1):
        go_to(i + 1)
        st.rerun()
    if c3.button("Submit test"):
        finish()
        st.rerun()

# ---------- result ----------
else:
    qs = S.questions
    scored = [i for i, q in enumerate(qs) if q.get("options") and q.get("answer") is not None]
    correct = sum(1 for i in scored if S.answers.get(i) == qs[i]["answer"])
    st.title("Results")
    if scored:
        st.metric("Score", f"{correct} / {len(scored)}")
    st.caption(f"Total time: {int(sum(S.times.values()))} s")
    for i, q in enumerate(qs):
        opts = q.get("options") or []
        mine = S.answers.get(i)
        ok = q.get("answer")
        mark = "✅" if (opts and ok is not None and mine == ok) else ("❌" if opts and ok is not None else "•")
        with st.expander(f"{mark} Q{i + 1} · {int(S.times.get(i, 0))} s"):
            st.write(q.get("question", ""))
            if opts:
                st.write("Your answer:", opts[mine] if mine is not None else "—")
                if ok is not None:
                    st.write("Correct answer:", opts[ok])
            else:
                st.write("Your answer:", mine or "—")
    if st.button("New test"):
        S.stage, S.questions = "setup", []
        st.rerun()
