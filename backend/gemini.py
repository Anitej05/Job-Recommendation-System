import os
import re
import json
import logging
from typing import List, Dict, Any

from google import genai
from google.genai import types
from dotenv import load_dotenv

# -----------------------------------------------------------------------------
# 1. Load env & init client
# -----------------------------------------------------------------------------
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("Set GEMINI_API_KEY in .env or environment")

client = genai.Client(api_key=GEMINI_API_KEY)

logger = logging.getLogger("gemini")
if not logger.hasHandlers():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )

MODEL_NAME = "gemini-2.0-flash"

# -----------------------------------------------------------------------------
# 2. Helpers
# -----------------------------------------------------------------------------
def sanitize_query_text(raw: str) -> str:
    if not isinstance(raw, str):
        return ""
    cleaned = re.sub(r'[`*\"“”‘’]', '', raw)
    cleaned = cleaned.replace('\\', '\\\\').replace('\n', ' ').replace('\r', '')
    return re.sub(r'\s+', ' ', cleaned).strip()

def safe_parse_json_array(raw_text: str, fallback_empty_list: bool = True) -> List[Dict[str, Any]]:
    if not isinstance(raw_text, str):
        logger.warning(f"Invalid input type: {type(raw_text)}")
        return [] if fallback_empty_list else None

    raw = raw_text.strip()
    if not raw:
        logger.warning("Empty response for JSON parsing.")
        return [] if fallback_empty_list else None

    # Extract between first '[' and last ']'
    start = raw.find('[')
    end   = raw.rfind(']')
    if start == -1 or end == -1 or end <= start:
        logger.error("Could not find JSON array delimiters in response.")
        return [] if fallback_empty_list else None

    json_text = raw[start:end+1]

    # Clean trailing commas
    json_text = re.sub(r',\s*(?=[}\]])', '', json_text)

    try:
        parsed = json.loads(json_text)
        if isinstance(parsed, list):
            return parsed
        logger.warning("Parsed JSON is not a list.")
        return [] if fallback_empty_list else None
    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error after cleaning: {e}; snippet: {json_text[:200]}...")
        return [] if fallback_empty_list else None

# -----------------------------------------------------------------------------
# 3. Main API call
# -----------------------------------------------------------------------------
def call_gemini_api(mode: str, payload: Dict[str, Any]) -> Any:
    search_tool = types.Tool(google_search=types.GoogleSearch())
    gen_config  = types.GenerateContentConfig(
        tools=[search_tool],
        temperature=1.0,
        max_output_tokens=4096
    )

    if mode == "recommendation":
        prefs   = sanitize_query_text(payload.get('preferences',''))
        skills  = sanitize_query_text(payload.get('skills',''))
        details = sanitize_query_text(payload.get('detailed_expectations',''))

        prompt = (
            "You are an AI Job Recommendation Assistant.\n"
            f"Find up to 9 current job postings based on preferences: {prefs}; "
            f"skills: {skills}; details: {details}.\n"
            "Respond with ONLY a JSON array of objects having keys: "
            "title, company, url, short_description, skills, relevance_notes."
        )
        logger.info(f"Recommendation prompt: {prompt}")

        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=[prompt],
            config=gen_config
        )
        raw = response.text or ""
        logger.info(f"Raw response start: {raw[:200]}...")
        return safe_parse_json_array(raw)

    elif mode == "chat":
        message = sanitize_query_text(payload.get("message",""))
        if not message:
            return "Please provide a message to chat."
        chat_cfg = types.GenerateContentConfig(temperature=0.7, max_output_tokens=512)
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=[message],
            config=chat_cfg
        )
        return response.text.strip()

    elif mode == "market_trends":
        sector = sanitize_query_text(payload.get('sector',''))
        prompt = (
            "You are a Career Trends Analyst AI.\n"
            f"Provide 5 actionable career tips for sector: {sector}.\n"
            "Respond with ONLY a JSON array of objects having keys: title, description."
        )
        logger.info(f"Market trends prompt: {prompt}")

        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=[prompt],
            config=gen_config
        )
        return safe_parse_json_array(response.text or "")

    else:
        logger.error(f"Unknown mode: {mode}")
        raise ValueError(f"Unknown mode: {mode!r}")

# -----------------------------------------------------------------------------
# 4. CLI for testing
# -----------------------------------------------------------------------------
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser("Job Recommender CLI")
    parser.add_argument("mode", choices=["recommendation","chat","market_trends"])
    parser.add_argument("--preferences",           default="Remote, Full-time, USA")
    parser.add_argument("--skills",                default="Python, React")
    parser.add_argument("--detailed_expectations", default="")
    parser.add_argument("--message",               default="Hello!")
    parser.add_argument("--sector",                default="Technology")
    args = parser.parse_args()

    mode_arg = args.mode
    payload  = vars(args)
    del payload['mode']

    logger.info(f"CLI call: mode={mode_arg}, payload={payload}")
    result = call_gemini_api(mode_arg, payload)
    print(json.dumps(result, indent=2))
